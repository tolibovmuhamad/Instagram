import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Account, AuthTokens } from "@/features/auth/types";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/features/auth/api", () => ({ refreshTokensRequest: vi.fn() }));

const { refreshTokensRequest } = await import("@/features/auth/api");

// Токен подписан не по-настоящему: decodeJwt читает только payload, подпись ему не нужна.
function fakeJwt(userId: string, userName = "fresh") {
  const payload = Buffer.from(
    JSON.stringify({ userId, userName, email: "u@e.com", sessionId: "s1" }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

function tokens(over: Partial<AuthTokens> = {}): AuthTokens {
  return {
    accessToken: fakeJwt("u1"),
    refreshToken: "refresh-2",
    expiresIn: 900,
    sessionId: "s1",
    ...over,
  };
}

function account(over: Partial<Account> = {}): Account {
  return {
    userId: "u1",
    userName: "u1",
    email: "u@e.com",
    accessToken: STALE,
    refreshToken: "refresh-1",
    sessionId: "s1",
    expiresAt: Date.now() + 900_000,
    ...over,
  };
}

/** Записать аккаунты в стор вместе с зеркалом активного (как это делает сам стор). */
function seedAccounts(accounts: Account[], activeUserId: string | null) {
  const active = accounts.find((a) => a.userId === activeUserId) ?? null;
  useAuthStore.setState({
    accounts,
    activeUserId,
    accessToken: active?.accessToken ?? null,
    refreshToken: active?.refreshToken ?? null,
    sessionId: active?.sessionId ?? null,
    user: active ? { id: active.userId, userName: active.userName, email: active.email } : null,
  });
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError("Request failed with status code 401", "ERR_BAD_REQUEST", config, null, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config,
    data: { data: null, errors: ["Сессия завершена или истекла."], statusCode: 401 },
  } as AxiosResponse);
}

const STALE = "stale-access-token";

describe("обновление access-токена в apiClient", () => {
  beforeEach(() => {
    vi.mocked(refreshTokensRequest).mockReset();
    seedAccounts([account()], "u1");
  });

  it("на пачку одновременных 401 обновляет токен один раз", async () => {
    // Бэкенд ротирует refreshToken и считает повторное использование атакой: второй
    // параллельный вызов завершил бы ВСЕ сессии пользователя. Ровно это и проверяем.
    vi.mocked(refreshTokensRequest).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return tokens();
    });

    apiClient.defaults.adapter = async (config) => {
      if (config.headers.Authorization === `Bearer ${STALE}`) throw unauthorized(config);
      return {
        data: { data: "ok", errors: [], statusCode: 200 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      } as AxiosResponse;
    };

    const results = await Promise.all(
      Array.from({ length: 5 }, () => apiClient.get("/Session/get-active-sessions")),
    );

    expect(refreshTokensRequest).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.data)).toEqual(["ok", "ok", "ok", "ok", "ok"]);
    expect(useAuthStore.getState().accessToken).toBe(tokens().accessToken);
  });

  it("удаляет аккаунт, если обновиться не удалось", async () => {
    vi.mocked(refreshTokensRequest).mockRejectedValue(new Error("refresh отклонён"));

    apiClient.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(apiClient.get("/Session/get-active-sessions")).rejects.toThrow();
    expect(useAuthStore.getState().accounts).toHaveLength(0);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("не пытается обновляться, когда refresh-токена нет", async () => {
    seedAccounts([account({ refreshToken: "" })], "u1");

    apiClient.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(apiClient.get("/Session/get-active-sessions")).rejects.toThrow();
    expect(refreshTokensRequest).not.toHaveBeenCalled();
  });

  it("обновляет токен только упавшего аккаунта, не трогая остальные", async () => {
    // Два аккаунта; активен u1 со STALE-токеном. Обновиться должен ровно u1, аккаунт u2
    // остаётся с прежней парой (иначе повторное использование его refresh отозвало бы сессии).
    seedAccounts(
      [
        account({ userId: "u1", userName: "u1", accessToken: STALE, refreshToken: "refresh-u1" }),
        account({
          userId: "u2",
          userName: "u2",
          accessToken: "u2-access",
          refreshToken: "refresh-u2",
        }),
      ],
      "u1",
    );

    vi.mocked(refreshTokensRequest).mockResolvedValue(
      tokens({ accessToken: fakeJwt("u1"), refreshToken: "refresh-u1-next" }),
    );

    apiClient.defaults.adapter = async (config) => {
      if (config.headers.Authorization === `Bearer ${STALE}`) throw unauthorized(config);
      return {
        data: { data: "ok", errors: [], statusCode: 200 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      } as AxiosResponse;
    };

    await apiClient.get("/Session/get-active-sessions");

    expect(refreshTokensRequest).toHaveBeenCalledExactlyOnceWith("refresh-u1");
    const state = useAuthStore.getState();
    expect(state.accounts.find((a) => a.userId === "u1")?.accessToken).toBe(fakeJwt("u1"));
    expect(state.accounts.find((a) => a.userId === "u1")?.refreshToken).toBe("refresh-u1-next");
    // Фоновый аккаунт u2 нетронут.
    expect(state.accounts.find((a) => a.userId === "u2")?.accessToken).toBe("u2-access");
    expect(state.accounts.find((a) => a.userId === "u2")?.refreshToken).toBe("refresh-u2");
  });
});
