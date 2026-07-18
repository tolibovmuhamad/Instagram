import { decodeJwt } from "@/lib/utils/jwt";

/**
 * Ответ `/Account/login`, `/Account/register` и `/Account/refresh-token`.
 * Схемы в Swagger нет — форма выяснена запросом к API (июль 2026).
 *
 * Раньше бэкенд отдавал голую строку JWT; теперь это объект с парой токенов.
 * `expiresIn` — время жизни accessToken в секундах (сейчас 900, т.е. 15 минут),
 * поэтому без обновления по refreshToken сессия умирает почти сразу.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Секунды до истечения accessToken. */
  expiresIn: number;
  /** Id сессии, она же строка в «Активные сеансы». Дублируется claim'ом sessionId в JWT. */
  sessionId: string;
}

/**
 * Один вошедший аккаунт. Мультиаккаунт — целиком клиентская фича: приложение держит
 * несколько таких записей и подставляет токен активного в `Authorization`. Бэкенд про это
 * ничего не знает — `/Account/login` можно звать сколько угодно раз, каждый выдаёт свою пару.
 */
export interface Account {
  userId: string;
  userName: string;
  email: string;
  /** Подтягивается из профиля после логина (в JWT его нет). */
  fullName?: string;
  /** Имя файла аватара (как его отдаёт бэкенд), либо null. */
  avatar?: string | null;
  isVerified?: boolean;
  accessToken: string;
  refreshToken: string;
  /** Id сессии этого аккаунта — нужен, чтобы «Активные сеансы» отметили «Это устройство». */
  sessionId: string;
  /** Абсолютный timestamp (мс) истечения accessToken — для проактивного refresh. */
  expiresAt: number;
}

/** Лимит одновременных аккаунтов, как в оригинальном Instagram. */
export const MAX_ACCOUNTS = 5;

/**
 * Собирает `Account` из пары токенов. userId/userName/email/sessionId берём из JWT
 * (отдельными полями бэкенд их не отдаёт), срок жизни — из `expiresIn`, а при возможности
 * уточняем по claim'у `exp` внутри токена (он авторитетнее).
 *
 * Профиль (аватар, fullName, isVerified) в токене отсутствует — эти поля дозаполняются
 * позже через `/UserProfile/get-my-profile`, поэтому здесь опциональны.
 */
export function buildAccountFromTokens(tokens: AuthTokens): Account {
  const claims = decodeJwt(tokens.accessToken);
  const expFromJwt = claims?.exp ? claims.exp * 1000 : null;
  return {
    userId: claims?.userId ?? "",
    userName: claims?.userName ?? "",
    email: claims?.email ?? "",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionId: tokens.sessionId ?? claims?.sessionId ?? "",
    expiresAt: expFromJwt ?? Date.now() + tokens.expiresIn * 1000,
  };
}
