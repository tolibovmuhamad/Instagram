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
  }
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-backend-ea2y.onrender.com";

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

// --- Обновление access-токена ---------------------------------------------------
//
// Токен живёт 15 минут, а refreshToken одноразовый: бэкенд его ротирует и считает
// повторное использование атакой — отвечает 401 и завершает ВСЕ сессии пользователя.
// Значит два параллельных обновления недопустимы, а приложение опрашивает сервер
// поллингом сразу из нескольких хуков, и по истечении токена 401 прилетает пачкой.
//
// Отсюда две ступени защиты:
//  1) refreshPromise — одно обновление на вкладку, остальные ждут его результат;
//  2) Web Locks — сериализация между вкладками; получив лок, проверяем, не обновил ли
//     токен кто-то другой, пока мы ждали (store синхронизируется через storage-событие,
//     см. store/auth.ts), и тогда просто берём готовый.
let refreshPromise: Promise<string> | null = null;

async function requestNewTokens(staleToken: string | null): Promise<string> {
  const state = useAuthStore.getState();

  // Пока ждали лок, соседняя вкладка могла всё сделать за нас.
  if (state.accessToken && state.accessToken !== staleToken) {
    return state.accessToken;
  }
  if (!state.refreshToken) {
    throw new ApiError("Сессия истекла, войдите заново", 401);
  }

  // Импорт внутри функции: features/auth/api.ts импортирует apiClient из этого модуля,
  // статический импорт замкнул бы цикл.
  const { refreshTokensRequest } = await import("@/features/auth/api");
  const tokens = await refreshTokensRequest(state.refreshToken);
  useAuthStore.getState().setAuth(tokens);
  return tokens.accessToken;
}

function refreshAccessToken(staleToken: string | null): Promise<string> {
  refreshPromise ??= (async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return await navigator.locks.request("auth-token-refresh", () =>
          requestNewTokens(staleToken),
        );
      }
      return await requestNewTokens(staleToken);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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

    // Протух access-токен — обновляем и повторяем запрос один раз.
    if (error.response?.status === 401 && config && !config._retried) {
      const staleToken = useAuthStore.getState().accessToken;
      if (useAuthStore.getState().refreshToken) {
        config._retried = true;
        try {
          const accessToken = await refreshAccessToken(staleToken);
          config.headers.Authorization = `Bearer ${accessToken}`;
          return await apiClient(config);
        } catch {
          // Обновиться не вышло — ниже отработает обычный выход из аккаунта.
        }
      }
    }

    const envelope = error.response?.data;
    const message = extractMessage(envelope?.errors, error.message || "Произошла ошибка");

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    if (!config?.skipErrorToast) {
      toast.error(message);
    }

    return Promise.reject(new ApiError(message, error.response?.status, envelope?.errors ?? []));
  },
);
