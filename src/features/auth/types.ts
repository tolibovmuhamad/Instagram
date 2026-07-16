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
