import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useActiveSessions } from "../hooks";
import type { ActiveSession } from "../types";

vi.mock("../api", () => ({
  getActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllOtherSessions: vi.fn(),
}));

const { getActiveSessions } = await import("../api");

function session(over: Partial<ActiveSession> & Pick<ActiveSession, "id">): ActiveSession {
  return {
    deviceName: "Chrome на Windows",
    deviceType: "Web",
    browser: "Chrome",
    os: "Windows",
    ipAddress: "10.0.0.1",
    location: null,
    createdAt: "2026-07-16T10:00:00Z",
    lastActivityAt: "2026-07-16T10:00:00Z",
    isCurrent: false,
    ...over,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useActiveSessions", () => {
  beforeEach(() => {
    vi.mocked(getActiveSessions).mockReset();
  });

  it("ставит текущую сессию первой, остальные — по свежести активности", async () => {
    vi.mocked(getActiveSessions).mockResolvedValue([
      session({ id: "old", lastActivityAt: "2026-07-16T09:00:00Z" }),
      session({ id: "recent", lastActivityAt: "2026-07-16T11:00:00Z" }),
      session({ id: "current", isCurrent: true, lastActivityAt: "2026-07-16T08:00:00Z" }),
    ]);

    const { result } = renderHook(() => useActiveSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Текущая — первой, несмотря на самую старую активность.
    expect(result.current.data?.map((s) => s.id)).toEqual(["current", "recent", "old"]);
  });

  it("не падает на пустом списке", async () => {
    vi.mocked(getActiveSessions).mockResolvedValue([]);

    const { result } = renderHook(() => useActiveSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
