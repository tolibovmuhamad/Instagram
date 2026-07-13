const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const YEAR = 31536000;

/**
 * Короткая относительная дата в стиле шапки поста Instagram:
 * «5 с.», «30 мин.», «3 ч.», «2 дн.», «1 нед.», «2 г.».
 */
export function formatTimeAgoShort(date: string | Date, now: Date = new Date()): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(1, Math.floor((now.getTime() - then.getTime()) / 1000));

  if (seconds < MINUTE) return `${seconds} с.`;
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)} мин.`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)} ч.`;
  if (seconds < WEEK) return `${Math.floor(seconds / DAY)} дн.`;
  if (seconds < YEAR) return `${Math.floor(seconds / WEEK)} нед.`;
  return `${Math.floor(seconds / YEAR)} г.`;
}
