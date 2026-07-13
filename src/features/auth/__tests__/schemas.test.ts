import { describe, expect, it } from "vitest";

import { registerSchema } from "../schemas";

describe("registerSchema", () => {
  const validBase = {
    userName: "claude_dev_probe2",
    fullName: "Second Probe",
    email: "probe2@example.com",
    password: "Test12345!",
    confirmPassword: "Test12345!",
  };

  it("accepts matching passwords", () => {
    expect(registerSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects mismatched passwords, flagging confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      confirmPassword: "SomethingElse!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short password", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      password: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
  });
});
