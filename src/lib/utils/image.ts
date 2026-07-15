const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-backend-ea2y.onrender.com";

// Бэкенд отдаёт в JSON только имя файла (например "665fd3…png"), а не полный URL —
// статика реально раздаётся с ${API_URL}/images/{filename} (проверено вручную).
export function resolveImageUrl(filename: string | null | undefined): string | undefined {
  if (!filename) return undefined;
  return `${API_URL}/images/${filename}`;
}

// Локальная заглушка-аватар (серый силуэт, как в оригинальном Instagram) для
// пользователей без загруженного фото. Лежит в public/, поэтому путь абсолютный от корня.
export const DEFAULT_AVATAR_URL = "/default-avatar.jpg";

// Аватар пользователя: тот же resolveImageUrl, но при отсутствии файла возвращает
// заглушку вместо undefined — так у аватара всегда есть src, а не голые инициалы.
export function resolveAvatarUrl(filename: string | null | undefined): string {
  return resolveImageUrl(filename) ?? DEFAULT_AVATAR_URL;
}
