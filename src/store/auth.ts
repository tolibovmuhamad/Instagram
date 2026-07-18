import { create } from "zustand";
import { persist } from "zustand/middleware";

import { buildAccountFromTokens, MAX_ACCOUNTS, type Account, type AuthTokens } from "@/features/auth/types";
import { decodeJwt } from "@/lib/utils/jwt";

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
}

interface AuthState {
  /** Все вошедшие аккаунты (до MAX_ACCOUNTS штук). Источник истины. */
  accounts: Account[];
  /** userId активного аккаунта — чей токен подставляется в запросы. */
  activeUserId: string | null;

  // --- Зеркало активного аккаунта --------------------------------------------------
  // Дублирует поля активного аккаунта, чтобы существующие потребители (`state.user`,
  // `state.accessToken`, …) и их зависимости-подписки продолжали работать без переписывания.
  // Пересобирается в каждом экшене через syncActive().
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  user: AuthUser | null;

  /**
   * Счётчик «поколения» авторизации: инкрементируется при switch/logout. Используется как
   * зависимость эффекта в useLiveHub, чтобы переподключить единственный SignalR-хаб с
   * токеном нового активного аккаунта (REST-опрос переезжает сам — через сброс кэша).
   */
  authEpoch: number;

  hasHydrated: boolean;

  /** Back-compat: добавить/обновить аккаунт по токенам и сделать его активным (флоу логина). */
  setAuth: (tokens: AuthTokens) => string;
  /** Явный алиас setAuth: логин, который добавляет аккаунт, а не затирает список. */
  addAccount: (tokens: AuthTokens) => string;
  /** Обновить пару токенов конкретного аккаунта после refresh (по userId, не «активного»). */
  updateAccountTokens: (userId: string, tokens: AuthTokens) => void;
  /** Дозаполнить профильные поля аккаунта (аватар, fullName, isVerified) после логина. */
  updateAccountProfile: (
    userId: string,
    patch: Partial<Pick<Account, "userName" | "fullName" | "avatar" | "isVerified">>,
  ) => void;
  /** Переключить активный аккаунт. Кэш/стейт чистит вызывающий хук (useAccounts). */
  switchAccount: (userId: string) => void;
  /** Убрать аккаунт из списка (локально). Если он был активным — активируется следующий. */
  removeAccount: (userId: string) => void;
  /** Back-compat: выйти из активного аккаунта (= removeAccount активного). */
  logout: () => void;
  /** Выйти из всех аккаунтов. */
  logoutAll: () => void;
  /** Внутреннее: пересобрать зеркало активного аккаунта из accounts[]/activeUserId. */
  syncActiveMirror: () => void;
  setHasHydrated: (value: boolean) => void;
}

/** Поля-зеркала активного аккаунта для заданного списка. */
function activeMirror(accounts: Account[], activeUserId: string | null) {
  const active = accounts.find((a) => a.userId === activeUserId) ?? null;
  return {
    accessToken: active?.accessToken ?? null,
    refreshToken: active?.refreshToken ?? null,
    sessionId: active?.sessionId ?? null,
    user: active ? { id: active.userId, userName: active.userName, email: active.email } : null,
  };
}

// Backend не поддерживает httpOnly cookie (чистый REST API без CORS-настройки под
// credentials), поэтому токены хранятся в localStorage через zustand persist — осознанный
// компромисс для pet-проекта. Мультиаккаунт этого не меняет: теперь в том же ключе лежит
// JSON со списком аккаунтов и id активного. Данные пользователя (id/userName/email) отдельным
// полем бэкенд не отдаёт — извлекаются декодированием accessToken при сборке Account.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeUserId: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      user: null,
      authEpoch: 0,
      hasHydrated: false,

      addAccount: (tokens) => {
        const account = buildAccountFromTokens(tokens);
        set((state) => {
          const existing = state.accounts.find((a) => a.userId === account.userId);
          // Повторный вход в уже добавленный аккаунт — обновляем его токены/сессию, но
          // сохраняем уже подтянутый профиль (аватар/fullName), чтобы не мигал плейсхолдер.
          const accounts = existing
            ? state.accounts.map((a) =>
                a.userId === account.userId ? { ...a, ...account } : a,
              )
            : [...state.accounts, account].slice(-MAX_ACCOUNTS);
          const activeUserId = account.userId;
          return {
            accounts,
            activeUserId,
            authEpoch: state.authEpoch + 1,
            ...activeMirror(accounts, activeUserId),
          };
        });
        return account.userId;
      },

      setAuth: (tokens) => get().addAccount(tokens),

      updateAccountTokens: (userId, tokens) => {
        const patch = buildAccountFromTokens(tokens);
        set((state) => {
          const accounts = state.accounts.map((a) =>
            a.userId === userId
              ? {
                  ...a,
                  accessToken: patch.accessToken,
                  refreshToken: patch.refreshToken,
                  sessionId: patch.sessionId || a.sessionId,
                  expiresAt: patch.expiresAt,
                }
              : a,
          );
          return { accounts, ...activeMirror(accounts, state.activeUserId) };
        });
      },

      updateAccountProfile: (userId, patch) => {
        set((state) => {
          const accounts = state.accounts.map((a) =>
            a.userId === userId ? { ...a, ...patch } : a,
          );
          return { accounts, ...activeMirror(accounts, state.activeUserId) };
        });
      },

      switchAccount: (userId) => {
        set((state) => {
          if (!state.accounts.some((a) => a.userId === userId)) return state;
          if (userId === state.activeUserId) return state;
          return {
            activeUserId: userId,
            authEpoch: state.authEpoch + 1,
            ...activeMirror(state.accounts, userId),
          };
        });
      },

      removeAccount: (userId) => {
        set((state) => {
          const accounts = state.accounts.filter((a) => a.userId !== userId);
          const wasActive = state.activeUserId === userId;
          const activeUserId = wasActive
            ? (accounts[0]?.userId ?? null)
            : state.activeUserId;
          return {
            accounts,
            activeUserId,
            authEpoch: wasActive ? state.authEpoch + 1 : state.authEpoch,
            ...activeMirror(accounts, activeUserId),
          };
        });
      },

      logout: () => {
        const active = get().activeUserId;
        if (active) get().removeAccount(active);
      },

      logoutAll: () => {
        set((state) => ({
          accounts: [],
          activeUserId: null,
          authEpoch: state.authEpoch + 1,
          ...activeMirror([], null),
        }));
      },

      syncActiveMirror: () =>
        set((state) => activeMirror(state.accounts, state.activeUserId)),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      // v2 — переезд на новый бэкенд (другие claim'ы). v3 — пара access/refresh.
      // v4 — мультиаккаунт: вместо одиночного токена храним accounts[] + activeUserId.
      version: 4,
      migrate: (persisted, version) => {
        // Пользователь с одним аккаунтом со старой схемы (v3) не должен разлогиниться:
        // сворачиваем его единственную сессию в массив из одного аккаунта.
        if (version < 4) {
          const prev = persisted as {
            accessToken?: string | null;
            refreshToken?: string | null;
            sessionId?: string | null;
          } | null;
          if (prev?.accessToken && prev.refreshToken) {
            const claims = decodeJwt(prev.accessToken);
            const account: Account = {
              userId: claims?.userId ?? "",
              userName: claims?.userName ?? "",
              email: claims?.email ?? "",
              accessToken: prev.accessToken,
              refreshToken: prev.refreshToken,
              sessionId: prev.sessionId ?? claims?.sessionId ?? "",
              expiresAt: claims?.exp ? claims.exp * 1000 : Date.now(),
            };
            return { accounts: [account], activeUserId: account.userId };
          }
        }
        return { accounts: [], activeUserId: null };
      },
      partialize: (state) => ({
        accounts: state.accounts,
        activeUserId: state.activeUserId,
      }),
      onRehydrateStorage: () => (state) => {
        // ⚠️ Этот колбэк выполняется СИНХРОННО внутри create(persist(...)) — до присвоения
        // `const useAuthStore`. Ссылаться здесь на `useAuthStore` нельзя (temporal dead zone,
        // ошибка гасит гидратацию и hasHydrated навсегда остаётся false). Работаем только
        // через параметр `state`: его экшены замкнуты на set/get и уже доступны.
        // syncActiveMirror пересобирает зеркало активного аккаунта (в persist его нет).
        state?.syncActiveMirror();
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Обновление токена в одной вкладке ротирует refreshToken — остальные вкладки обязаны видеть
// свежую пару, иначе повторное использование старого refresh бэкенд посчитает атакой и
// завершит все сессии. persist пишет в localStorage, а storage-событие (прилетает только в
// другие вкладки) заставляет их перечитать значение; onRehydrateStorage пересоберёт зеркало.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "auth-storage") {
      void useAuthStore.persist.rehydrate();
    }
  });
}
