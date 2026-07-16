import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserSearchResult } from "@/features/users/types";

// Настройки, у которых НЕТ эндпоинта на бэкенде (уведомления-тумблеры, скрытые слова,
// комментарии/репосты/счётчики лайков, а также локальные списки «скрытых» и
// «ограниченных» аккаунтов). Храним их локально через zustand persist, чтобы UI был
// по-настоящему функциональным и запоминал выбор между сессиями. Это осознанный
// компромисс pet-проекта: серверных ручек для этих разделов пока не существует.

// Достаточно карточки для отрисовки строки в списке — тот же формат, что у поиска.
export type LocalUser = Pick<
  UserSearchResult,
  "id" | "userName" | "fullName" | "avatar" | "isVerified"
>;

export interface NotificationPrefs {
  pauseAll: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  mentions: boolean;
  messages: boolean;
  storyReplies: boolean;
}

export type CommentAudience = "everyone" | "followers" | "following" | "off";

interface SettingsPrefsState {
  notifications: NotificationPrefs;
  setNotification: (key: keyof NotificationPrefs, value: boolean) => void;

  hideLikeCounts: boolean;
  setHideLikeCounts: (value: boolean) => void;

  allowComments: CommentAudience;
  setAllowComments: (value: CommentAudience) => void;

  allowReposts: boolean;
  setAllowReposts: (value: boolean) => void;

  hiddenWordsEnabled: boolean;
  setHiddenWordsEnabled: (value: boolean) => void;
  hiddenWords: string[];
  addHiddenWord: (word: string) => void;
  removeHiddenWord: (word: string) => void;

  mutedUsers: LocalUser[];
  toggleMuted: (user: LocalUser) => void;

  restrictedUsers: LocalUser[];
  toggleRestricted: (user: LocalUser) => void;
}

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  pauseAll: false,
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  messages: true,
  storyReplies: true,
};

function toggleUser(list: LocalUser[], user: LocalUser): LocalUser[] {
  return list.some((u) => u.id === user.id)
    ? list.filter((u) => u.id !== user.id)
    : [...list, user];
}

export const useSettingsPrefs = create<SettingsPrefsState>()(
  persist(
    (set) => ({
      notifications: DEFAULT_NOTIFICATIONS,
      setNotification: (key, value) =>
        set((state) => ({ notifications: { ...state.notifications, [key]: value } })),

      hideLikeCounts: false,
      setHideLikeCounts: (value) => set({ hideLikeCounts: value }),

      allowComments: "everyone",
      setAllowComments: (value) => set({ allowComments: value }),

      allowReposts: true,
      setAllowReposts: (value) => set({ allowReposts: value }),

      hiddenWordsEnabled: false,
      setHiddenWordsEnabled: (value) => set({ hiddenWordsEnabled: value }),
      hiddenWords: [],
      addHiddenWord: (word) =>
        set((state) => {
          const normalized = word.trim().toLowerCase();
          if (!normalized || state.hiddenWords.includes(normalized)) return state;
          return { hiddenWords: [...state.hiddenWords, normalized] };
        }),
      removeHiddenWord: (word) =>
        set((state) => ({ hiddenWords: state.hiddenWords.filter((w) => w !== word) })),

      mutedUsers: [],
      toggleMuted: (user) => set((state) => ({ mutedUsers: toggleUser(state.mutedUsers, user) })),

      restrictedUsers: [],
      toggleRestricted: (user) =>
        set((state) => ({ restrictedUsers: toggleUser(state.restrictedUsers, user) })),
    }),
    { name: "settings-prefs" },
  ),
);
