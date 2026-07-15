import { create } from "zustand";
import { persist } from "zustand/middleware";

import { decodeJwt } from "@/lib/utils/jwt";

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setAuth: (accessToken: string) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Backend не отдаёт refresh-токен и не поддерживает httpOnly cookie (чистый REST API
// без CORS-настройки под credentials), поэтому JWT хранится в localStorage через
// zustand persist — осознанный компромисс для pet-проекта, а не значение по умолчанию.
// Данные пользователя (id/userName/email) не приходят отдельным полем при логине —
// бэкенд возвращает только сырой JWT, поэтому они всегда извлекаются декодированием токена.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setAuth: (accessToken) => {
        const claims = decodeJwt(accessToken);
        set({
          accessToken,
          user: claims
            ? { id: claims.userId, userName: claims.userName, email: claims.email }
            : null,
        });
      },
      logout: () => set({ accessToken: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      // Токены старого бэкенда (другой ключ подписи и другие claim'ы) новым не принимаются,
      // а сохранённый рядом user собран из claim'ов sid/name, которых больше нет. Поднятая
      // версия выбрасывает такую сессию при гидратации, вместо того чтобы ловить 401 на
      // первом же запросе и показывать пользователю «пустой» аккаунт без id.
      version: 2,
      migrate: () => ({ accessToken: null, user: null }),
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
