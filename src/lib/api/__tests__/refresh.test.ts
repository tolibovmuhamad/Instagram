import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthTokens } from "@/features/auth/types";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/features/auth/api", () => ({ refreshTokensRequest: vi.fn() }));

const { refreshTokensRequest } = await import("@/features/auth/api");

// Токен подписан не по-настоящему: decodeJwt читает только payload, подпись ему не нужна.
function fakeJwt(userName: string) {
  const payload = Buffer.from(
    JSON.stringify({ userId: "u1", userName, email: "u@e.com", sessionId: "s1" }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

function tokens(over: Partial<AuthTokens> = {}): AuthTokens {
  return {
    accessToken: fakeJwt("fresh"),
    refreshToken: "refresh-2",
    expiresIn: 900,
    sessionId: "s1",
    ...over,
  };
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
    useAuthStore.setState({
      accessToken: STALE,
      refreshToken: "refresh-1",
      sessionId: "s1",
      user: null,
    });
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

  it("разлогинивает, если обновиться не удалось", async () => {
    vi.mocked(refreshTokensRequest).mockRejectedValue(new Error("refresh отклонён"));

    apiClient.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(apiClient.get("/Session/get-active-sessions")).rejects.toThrow();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it("не пытается обновляться, когда refresh-токена нет", async () => {
    useAuthStore.setState({ accessToken: STALE, refreshToken: null });

    apiClient.defaults.adapter = async (config) => {
      throw unauthorized(config);
    };

    await expect(apiClient.get("/Session/get-active-sessions")).rejects.toThrow();
    expect(refreshTokensRequest).not.toHaveBeenCalled();
  });
});
