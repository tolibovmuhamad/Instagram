const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://instagram-api.softclub.tj";

// Бэкенд отдаёт в JSON только имя файла (например "665fd3…png"), а не полный URL —
// статика реально раздаётся с ${API_URL}/images/{filename} (проверено вручную).
export function resolveImageUrl(filename: string | null | undefined): string | undefined {
  if (!filename) return undefined;
  return `${API_URL}/images/${filename}`;
}
