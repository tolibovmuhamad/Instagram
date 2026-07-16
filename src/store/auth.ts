import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthTokens } from "@/features/auth/types";
import { decodeJwt } from "@/lib/utils/jwt";

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /** Id текущей сессии — по нему «Активные сеансы» отмечают строку «Это устройство». */
  sessionId: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setAuth: (tokens: AuthTokens) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Backend не поддерживает httpOnly cookie (чистый REST API без CORS-настройки под
// credentials), поэтому токены хранятся в localStorage через zustand persist —
// осознанный компромисс для pet-проекта, а не значение по умолчанию.
// Данные пользователя (id/userName/email) отдельным полем не приходят — только сырой JWT,
// поэтому они всегда извлекаются декодированием accessToken.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      user: null,
      hasHydrated: false,
      setAuth: ({ accessToken, refreshToken, sessionId }) => {
        const claims = decodeJwt(accessToken);
        set({
          accessToken,
          refreshToken,
          sessionId,
          user: claims
            ? { id: claims.userId, userName: claims.userName, email: claims.email }
            : null,
        });
      },
      logout: () => set({ accessToken: null, refreshToken: null, sessionId: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      // v2 — переезд на новый бэкенд (другие claim'ы). v3 — бэкенд перешёл на пару
      // access/refresh: в сохранённых сессиях refreshToken'а нет, а access живёт 15 минут,
      // так что дотянуть их до рабочего состояния нечем — просим войти заново.
      version: 3,
      migrate: () => ({ accessToken: null, refreshToken: null, sessionId: null, user: null }),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        sessionId: state.sessionId,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Обновление токена в одной вкладке делает refreshToken остальных недействительным, а его
// повторное использование бэкенд считает атакой и завершает все сессии. Поэтому вкладки
// обязаны видеть общую пару токенов: persist пишет в localStorage, а storage-событие
// (прилетает только в другие вкладки) заставляет их перечитать свежее значение.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "auth-storage") {
      void useAuthStore.persist.rehydrate();
    }
  });
}
