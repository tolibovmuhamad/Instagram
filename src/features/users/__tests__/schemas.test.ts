import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "../schemas";

describe("updateProfileSchema", () => {
  it("accepts a valid gender + short about", () => {
    const result = updateProfileSchema.safeParse({ about: "Hello", gender: "Male" });
    expect(result.success).toBe(true);
  });

  it("rejects a gender value the backend doesn't support", () => {
    const result = updateProfileSchema.safeParse({ about: "Hello", gender: "Other" });
    expect(result.success).toBe(false);
  });

  it("rejects an about longer than 500 characters", () => {
    const result = updateProfileSchema.safeParse({
      about: "a".repeat(501),
      gender: "Male",
    });
    expect(result.success).toBe(false);
  });

  it("allows an empty about", () => {
    const result = updateProfileSchema.safeParse({ about: "", gender: "Female" });
    expect(result.success).toBe(true);
  });
});
