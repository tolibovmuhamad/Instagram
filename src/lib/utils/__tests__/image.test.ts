import { describe, expect, it } from "vitest";

import { DEFAULT_AVATAR_URL, resolveAvatarUrl, resolveImageUrl } from "../image";

describe("resolveImageUrl", () => {
  it("builds a full URL from a bare filename", () => {
    expect(resolveImageUrl("abc123.png")).toBe(
      "https://instagram-backend-ea2y.onrender.com/images/abc123.png",
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

  it("passes an absolute Cloudinary URL through unchanged", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/instaclone/images/abc.jpg";
    expect(resolveImageUrl(url)).toBe(url);
  });

  it("passes an http absolute URL through unchanged", () => {
    expect(resolveImageUrl("http://example.com/x.png")).toBe("http://example.com/x.png");
  });
});

describe("resolveAvatarUrl", () => {
  it("builds a full URL from a bare filename", () => {
    expect(resolveAvatarUrl("abc123.png")).toBe(
      "https://instagram-backend-ea2y.onrender.com/images/abc123.png",
    );
  });

  it("falls back to the default avatar for null", () => {
    expect(resolveAvatarUrl(null)).toBe(DEFAULT_AVATAR_URL);
  });

  it("falls back to the default avatar for undefined", () => {
    expect(resolveAvatarUrl(undefined)).toBe(DEFAULT_AVATAR_URL);
  });

  it("falls back to the default avatar for an empty string", () => {
    expect(resolveAvatarUrl("")).toBe(DEFAULT_AVATAR_URL);
  });
});
