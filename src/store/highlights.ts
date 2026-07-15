import { create } from "zustand";
import { persist } from "zustand/middleware";

// «Актуальное» (highlights) в бэкенде отсутствует как модуль (проверено по Swagger:
// эндпоинтов highlight/* нет). Поэтому храним его на клиенте как ССЫЛКИ на id историй
// из архива (get-my-stories). Удаление «актуального» убирает только ссылку — сама история
// в архиве остаётся. Ключ — userId владельца, чтобы разные аккаунты не смешивались.
interface HighlightsState {
  byUser: Record<string, number[]>;
  addHighlights: (userId: string, storyIds: number[]) => void;
  removeHighlight: (userId: string, storyId: number) => void;
}

export const useHighlightsStore = create<HighlightsState>()(
  persist(
    (set) => ({
      byUser: {},
      addHighlights: (userId, storyIds) =>
        set((state) => {
          const current = state.byUser[userId] ?? [];
          const merged = Array.from(new Set([...current, ...storyIds]));
          return { byUser: { ...state.byUser, [userId]: merged } };
        }),
      removeHighlight: (userId, storyId) =>
        set((state) => {
          const current = state.byUser[userId] ?? [];
          return {
            byUser: { ...state.byUser, [userId]: current.filter((id) => id !== storyId) },
          };
        }),
    }),
    { name: "highlights-storage", version: 1 },
  ),
);
