import { beforeEach, describe, expect, it } from "vitest";

import type { AuthTokens } from "@/features/auth/types";
import { useAuthStore } from "@/store/auth";

// JWT подписан не по-настоящему: decodeJwt читает только payload.
function fakeJwt(userId: string, userName = userId) {
  const payload = Buffer.from(
    JSON.stringify({ userId, userName, email: `${userId}@e.com`, sessionId: `s-${userId}` }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

function tokensFor(userId: string, over: Partial<AuthTokens> = {}): AuthTokens {
  return {
    accessToken: fakeJwt(userId),
    refreshToken: `refresh-${userId}`,
    expiresIn: 900,
    sessionId: `s-${userId}`,
    ...over,
  };
}

describe("useAuthStore — мультиаккаунт", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accounts: [],
      activeUserId: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      user: null,
      authEpoch: 0,
    });
  });

  it("логин добавляет аккаунт, а не затирает список, и делает его активным", () => {
    useAuthStore.getState().addAccount(tokensFor("a"));
    useAuthStore.getState().addAccount(tokensFor("b"));

    const state = useAuthStore.getState();
    expect(state.accounts.map((x) => x.userId)).toEqual(["a", "b"]);
    expect(state.activeUserId).toBe("b");
    // Зеркало активного аккаунта — для обратной совместимости с существующими селекторами.
    expect(state.accessToken).toBe(fakeJwt("b"));
    expect(state.user?.id).toBe("b");
  });

  it("повторный вход в существующий аккаунт обновляет токены без дубля и сохраняет профиль", () => {
    useAuthStore.getState().addAccount(tokensFor("a"));
    useAuthStore.getState().updateAccountProfile("a", { avatar: "a.png", fullName: "Алиса" });

    useAuthStore.getState().addAccount(tokensFor("a", { refreshToken: "refresh-a-2" }));

    const state = useAuthStore.getState();
    expect(state.accounts).toHaveLength(1);
    expect(state.accounts[0].refreshToken).toBe("refresh-a-2");
    // Профиль (аватар/имя) не сбросился при повторном логине.
    expect(state.accounts[0].avatar).toBe("a.png");
    expect(state.accounts[0].fullName).toBe("Алиса");
  });

  it("switchAccount меняет активного, зеркало и поднимает authEpoch", () => {
    useAuthStore.getState().addAccount(tokensFor("a"));
    useAuthStore.getState().addAccount(tokensFor("b"));
    const epochBefore = useAuthStore.getState().authEpoch;

    useAuthStore.getState().switchAccount("a");

    const state = useAuthStore.getState();
    expect(state.activeUserId).toBe("a");
    expect(state.accessToken).toBe(fakeJwt("a"));
    expect(state.authEpoch).toBe(epochBefore + 1);
  });

  it("удаление активного аккаунта активирует следующий", () => {
    useAuthStore.getState().addAccount(tokensFor("a"));
    useAuthStore.getState().addAccount(tokensFor("b"));

    useAuthStore.getState().removeAccount("b"); // b активен

    const state = useAuthStore.getState();
    expect(state.accounts.map((x) => x.userId)).toEqual(["a"]);
    expect(state.activeUserId).toBe("a");
    expect(state.accessToken).toBe(fakeJwt("a"));
  });

  it("удаление фонового аккаунта не трогает активного и epoch", () => {
    useAuthStore.getState().addAccount(tokensFor("a"));
    useAuthStore.getState().addAccount(tokensFor("b"));
    const epochBefore = useAuthStore.getState().authEpoch;

    useAuthStore.getState().removeAccount("a"); // активен b

    const state = useAuthStore.getState();
    expect(state.activeUserId).toBe("b");
    expect(state.authEpoch).toBe(epochBefore);
  });

  it("logoutAll очищает список и зеркало", () => {
    useAuthStore.getState().addAccount(tokensFor("a"));
    useAuthStore.getState().addAccount(tokensFor("b"));

    useAuthStore.getState().logoutAll();

    const state = useAuthStore.getState();
    expect(state.accounts).toHaveLength(0);
    expect(state.activeUserId).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("держит не больше MAX_ACCOUNTS аккаунтов, вытесняя самый старый", () => {
    for (const id of ["a", "b", "c", "d", "e", "f"]) {
      useAuthStore.getState().addAccount(tokensFor(id));
    }

    const state = useAuthStore.getState();
    expect(state.accounts).toHaveLength(5);
    // Самый старый (a) вытеснен, активен последний (f).
    expect(state.accounts.map((x) => x.userId)).toEqual(["b", "c", "d", "e", "f"]);
    expect(state.activeUserId).toBe("f");
  });
});
