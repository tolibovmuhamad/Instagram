import { describe, expect, it } from "vitest";

import { decodeJwt, isTokenExpired } from "../jwt";

function base64url(obj: object) {
  // btoa only handles Latin1 — UTF-8-encode first so non-ASCII (e.g. Cyrillic) claims survive.
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildToken(payload: Record<string, unknown>) {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url(payload);
  return `${header}.${body}.fake-signature`;
}

describe("decodeJwt", () => {
  it("decodes claims from a well-formed token", () => {
    const token = buildToken({
      userId: "user-123",
      userName: "claude_dev_probe2",
      email: "probe2@example.com",
      exp: 9999999999,
      iss: "InstagramClone",
      aud: "InstagramCloneUsers",
    });

    const claims = decodeJwt(token);
    expect(claims?.userId).toBe("user-123");
    expect(claims?.userName).toBe("claude_dev_probe2");
  });

  it("decodes non-ASCII (Cyrillic) claim values correctly", () => {
    const token = buildToken({ userName: "Пользователь", exp: 9999999999 });
    const claims = decodeJwt(token);
    expect(claims?.userName).toBe("Пользователь");
  });

  it("returns null for a malformed token instead of throwing", () => {
    expect(decodeJwt("not-a-jwt")).toBeNull();
    expect(decodeJwt("")).toBeNull();
  });
});

describe("isTokenExpired", () => {
  it("returns false for a token with a future exp", () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it("returns true for a token with a past exp", () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it("returns true for a malformed token", () => {
    expect(isTokenExpired("garbage")).toBe(true);
  });
});
