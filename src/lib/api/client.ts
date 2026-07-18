import axios, { type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth";
import { ApiError, type ApiEnvelope } from "./types";

declare module "axios" {
  // Вызывающий код может сам обработать ошибку и не хочет тоста поверх неё.
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
    /** Внутреннее: запрос уже повторяли после обновления токена, второй раз не пробуем. */
    _retried?: boolean;
    /**
     * Внутреннее: userId аккаунта, чьим токеном ушёл запрос. Ставится в request-интерцепторе.
     * При 401 обновляем токен именно этого аккаунта, а не «активного» — активный мог
     * смениться, пока фоновый запрос был в полёте (см. §4 промпта про мультиаккаунт).
     */
    _accountUserId?: string;
  }
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-backend-ea2y.onrender.com";

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  const active = state.accounts.find((a) => a.userId === state.activeUserId);
  if (active) {
    config.headers.Authorization = `Bearer ${active.accessToken}`;
    // Помечаем запрос владельцем-аккаунтом, чтобы при 401 обновить именно его токен.
    config._accountUserId = active.userId;
  }
  return config;
});

function extractMessage(errors: string[] | null | undefined, fallback: string) {
  return errors && errors.length > 0 ? errors.join(", ") : fallback;
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return (
    !!body && typeof body === "object" && !Array.isArray(body) && "statusCode" in body
  );
}

/** Разворачивает конверт {data, errors, statusCode} для запросов мимо apiClient. */
export function unwrapEnvelope<T>(body: unknown): T {
  if (!isEnvelope(body)) return body as T;
  if (body.errors && body.errors.length > 0) {
    throw new ApiError(extractMessage(body.errors, "Произошла ошибка"), body.statusCode, body.errors);
  }
  return body.data as T;
}

// --- Обновление access-токена (на каждый аккаунт отдельно) -----------------------
//
// Токен живёт 15 минут, а refreshToken одноразовый: бэкенд его ротирует и считает
// повторное использование атакой — отвечает 401 и завершает ВСЕ сессии этого пользователя.
// Значит два параллельных обновления ОДНОГО аккаунта недопустимы, а приложение опрашивает
// сервер поллингом сразу из нескольких хуков, и по истечении токена 401 прилетает пачкой.
//
// В мультиаккаунте дедупликация обязана быть ПО АККАУНТУ (map: userId → Promise), иначе
// обновление аккаунта A и аккаунта B мешали бы друг другу. Внутри одного аккаунта — две
// ступени защиты:
//  1) refreshPromises.get(userId) — одно обновление на вкладку, остальные ждут его результат;
//  2) Web Locks (имя лока включает userId) — сериализация между вкладками; получив лок,
//     проверяем, не обновил ли токен кто-то другой, пока мы ждали (store синхронизируется
//     через storage-событие, см. store/auth.ts), и тогда просто берём готовый.
const refreshPromises = new Map<string, Promise<string>>();

async function requestNewTokens(userId: string, staleToken: string): Promise<string> {
  const account = useAuthStore.getState().accounts.find((a) => a.userId === userId);
  if (!account) {
    throw new ApiError("Сессия истекла, войдите заново", 401);
  }
  // Пока ждали лок, соседняя вкладка могла всё сделать за нас.
  if (account.accessToken && account.accessToken !== staleToken) {
    return account.accessToken;
  }

  // Импорт внутри функции: features/auth/api.ts импортирует apiClient из этого модуля,
  // статический импорт замкнул бы цикл.
  const { refreshTokensRequest } = await import("@/features/auth/api");
  const tokens = await refreshTokensRequest(account.refreshToken);
  useAuthStore.getState().updateAccountTokens(userId, tokens);
  return tokens.accessToken;
}

function refreshAccountToken(userId: string, staleToken: string): Promise<string> {
  const inFlight = refreshPromises.get(userId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return await navigator.locks.request(`auth-token-refresh-${userId}`, () =>
          requestNewTokens(userId, staleToken),
        );
      }
      return await requestNewTokens(userId, staleToken);
    } finally {
      refreshPromises.delete(userId);
    }
  })();

  refreshPromises.set(userId, promise);
  return promise;
}

function bearerToken(config: { headers?: Record<string, unknown> | undefined }): string {
  const header = config.headers?.Authorization;
  return typeof header === "string" ? header.replace(/^Bearer\s+/, "") : "";
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (!isEnvelope(response.data)) {
      return response;
    }

    const envelope = response.data;

    if (envelope.errors && envelope.errors.length > 0) {
      const message = extractMessage(envelope.errors, "Произошла ошибка");
      toast.error(message);
      return Promise.reject(new ApiError(message, envelope.statusCode, envelope.errors));
    }

    // Пагинированные списки помимо data содержат pageNumber/pageSize/totalPages/totalRecords
    // на верхнем уровне конверта — собираем их в единый объект для infinite scroll.
    if (envelope.pageNumber !== undefined) {
      response.data = {
        items: envelope.data,
        pageNumber: envelope.pageNumber,
        pageSize: envelope.pageSize,
        totalPages: envelope.totalPages,
        totalRecords: envelope.totalRecords,
      } as never;
    } else {
      response.data = envelope.data as never;
    }

    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const config = error.config;

    // Протух access-токен — обновляем токен АККАУНТА, чей запрос упал, и повторяем один раз.
    if (error.response?.status === 401 && config && !config._retried) {
      const userId = config._accountUserId;
      const account = userId
        ? useAuthStore.getState().accounts.find((a) => a.userId === userId)
        : undefined;
      if (userId && account) {
        config._retried = true;
        if (account.refreshToken) {
          try {
            const accessToken = await refreshAccountToken(userId, bearerToken(config));
            config.headers.Authorization = `Bearer ${accessToken}`;
            return await apiClient(config);
          } catch {
            // Обновиться не вышло (refresh невалиден / аккаунт забанен) — убираем этот
            // аккаунт из списка. Если он был активным, стор активирует следующий, а
            // AuthGuard уведёт на логин, когда аккаунтов не останется.
            useAuthStore.getState().removeAccount(userId);
          }
        } else {
          // Токен мёртв, а обновить его нечем — этот аккаунт больше не рабочий.
          useAuthStore.getState().removeAccount(userId);
        }
      }
    }

    const envelope = error.response?.data;
    const message = extractMessage(envelope?.errors, error.message || "Произошла ошибка");

    if (!config?.skipErrorToast) {
      toast.error(message);
    }

    return Promise.reject(new ApiError(message, error.response?.status, envelope?.errors ?? []));
  },
);
