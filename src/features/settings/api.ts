import { apiClient } from "@/lib/api/client";

import type { PrivacySettings } from "./types";

// Настройки создаются на бэкенде по умолчанию при первом обращении, поэтому GET всегда
// возвращает полный объект (даже для нового аккаунта).
export async function getPrivacySettings() {
  const { data } = await apiClient.get<PrivacySettings>("/Settings/get-privacy");
  return data;
}

// Обновление — PUT c UpdatePrivacySettingsDto. Все поля опциональны, но во избежание
// сюрпризов на стороне сервера отправляем объект целиком (текущие значения + патч).
export async function updatePrivacySettings(settings: PrivacySettings) {
  await apiClient.put("/Settings/update-privacy", settings);
}
