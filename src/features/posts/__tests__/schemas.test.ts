import { describe, expect, it } from "vitest";

import { addCommentSchema, createPostSchema } from "../schemas";

describe("addCommentSchema", () => {
  it("rejects an empty comment", () => {
    expect(addCommentSchema.safeParse({ comment: "" }).success).toBe(false);
  });

  it("accepts a non-empty comment", () => {
    expect(addCommentSchema.safeParse({ comment: "Nice!" }).success).toBe(true);
  });

  it("rejects a comment over 500 characters", () => {
    expect(addCommentSchema.safeParse({ comment: "a".repeat(501) }).success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("allows empty title and content (backend doesn't require them)", () => {
    expect(createPostSchema.safeParse({ title: "", content: "" }).success).toBe(true);
  });

  it("rejects a title over 200 characters", () => {
    expect(
      createPostSchema.safeParse({ title: "a".repeat(201), content: "" }).success,
    ).toBe(false);
  });
});
