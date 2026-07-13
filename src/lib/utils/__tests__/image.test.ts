import { describe, expect, it } from "vitest";

import { resolveImageUrl } from "../image";

describe("resolveImageUrl", () => {
  it("builds a full URL from a bare filename", () => {
    expect(resolveImageUrl("abc123.png")).toBe(
      "https://instagram-api.softclub.tj/images/abc123.png",
    );
  });

  it("returns undefined for null", () => {
    expect(resolveImageUrl(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(resolveImageUrl(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty string (backend sometimes sends '' instead of null)", () => {
    expect(resolveImageUrl("")).toBeUndefined();
  });
});
