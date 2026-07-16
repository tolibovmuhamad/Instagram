/**
 * Строка списка `/Session/get-active-sessions`.
 *
 * У модуля Session в Swagger только пути — тела ответов пустые (`content?: never`),
 * поэтому форма выяснена запросами к API (июль 2026), как и у Chat/Notification.
 * Пример строки:
 * {
 *   "id": "4fc977f9-b621-444c-8e3f-90bedd8b136e",
 *   "deviceName": "curl", "deviceType": "Unknown", "browser": "curl",
 *   "os": null, "ipAddress": "150.228.207.187", "location": null,
 *   "createdAt": "2026-07-16T12:05:22.47761Z",
 *   "lastActivityAt": "2026-07-16T12:06:05.989912Z",
 *   "isCurrent": true
 * }
 *
 * Всё, кроме id/дат/isCurrent, бэкенд выводит из User-Agent и может вернуть null
 * или строку "Unknown" — UI обязан переживать оба варианта.
 */
export interface ActiveSession {
  id: string;
  deviceName: string | null;
  /** "Desktop" | "Mobile" | "Tablet" | "Unknown" — произвольная строка, не enum. */
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  createdAt: string;
  lastActivityAt: string;
  /** Сессия, из которой сделан текущий запрос. Её нельзя завершить кнопкой. */
  isCurrent: boolean;
}
