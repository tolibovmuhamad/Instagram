import { create } from "zustand";
import { persist } from "zustand/middleware";

// Какие истории пользователь уже посмотрел — нужно, чтобы кружок в ленте гас (серое кольцо
// вместо градиента), как в оригинальном Instagram.
//
// Почему на клиенте: в DTO истории нет признака «я её смотрел». `viewerDto.viewCount` —
// это ОБЩИЙ счётчик просмотров для автора, а не отметка для текущего зрителя, и
// `POST /Story/add-story-view` ничего не возвращает. Спросить у бэкенда нечего, поэтому
// отметки живут здесь (та же вынужденная схема, что у «Актуального», см. store/highlights).
// Побочный эффект: в другом браузере кольца снова будут градиентными.
//
// Ключ — userId владельца отметок, чтобы аккаунты на одном устройстве не смешивались.
interface StoryViewsState {
  byUser: Record<string, number[]>;
  markViewed: (userId: string, storyId: number) => void;
  hasViewed: (userId: string, storyId: number) => boolean;
}

// Истории живут 24 часа, а их id остаются в списке навсегда — без ограничения localStorage
// пухнет мёртвыми отметками. Держим только последние N: столько историй за раз человек
// физически не смотрит, а вытесняются самые старые, чьи истории давно истекли.
const MAX_TRACKED_PER_USER = 500;

export const useStoryViewsStore = create<StoryViewsState>()(
  persist(
    (set, get) => ({
      byUser: {},
      markViewed: (userId, storyId) =>
        set((state) => {
          const current = state.byUser[userId] ?? [];
          // Отметка ставится из эффекта вьюера на каждой смене сегмента — без этой
          // проверки повторный просмотр дёргал бы стор и перерисовывал всю ленту.
          if (current.includes(storyId)) return state;
          const next = [...current, storyId].slice(-MAX_TRACKED_PER_USER);
          return { byUser: { ...state.byUser, [userId]: next } };
        }),
      hasViewed: (userId, storyId) => (get().byUser[userId] ?? []).includes(storyId),
    }),
    { name: "story-views-storage", version: 1 },
  ),
);
