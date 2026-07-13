import { describe, expect, it } from "vitest";

import { isVideoFile } from "../media";

describe("isVideoFile", () => {
  it("recognizes common video extensions", () => {
    expect(isVideoFile("clip.mp4")).toBe(true);
    expect(isVideoFile("clip.MOV")).toBe(true);
    expect(isVideoFile("clip.webm")).toBe(true);
  });

  it("treats images as non-video", () => {
    expect(isVideoFile("photo.png")).toBe(false);
    expect(isVideoFile("photo.jpg")).toBe(false);
  });

  it("handles filenames without an extension", () => {
    expect(isVideoFile("noextension")).toBe(false);
  });
});
