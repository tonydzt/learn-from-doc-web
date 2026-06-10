import { describe, expect, it } from "vitest";

import { authMessageFromError, validateAuthCredentials } from "./auth";

describe("auth", () => {
  it("rejects invalid email addresses", () => {
    const result = validateAuthCredentials({
      email: "not-an-email",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/valid email/i);
    }
  });

  it("rejects empty passwords", () => {
    const result = validateAuthCredentials({
      email: "reader@example.com",
      password: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/password is required/i);
    }
  });

  it("rejects short passwords", () => {
    const result = validateAuthCredentials({
      email: "reader@example.com",
      password: "short",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/at least 8 characters/i);
    }
  });

  it("normalizes valid auth credentials", () => {
    const result = validateAuthCredentials({
      email: " Reader@Example.com ",
      password: "password123",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        email: "reader@example.com",
        password: "password123",
      },
    });
  });

  it("maps unconfirmed email errors to a clear message", () => {
    expect(authMessageFromError({ message: "Email not confirmed" })).toMatch(
      /confirm your email/i,
    );
  });

  it("maps invalid credential errors to a clear message", () => {
    expect(authMessageFromError({ message: "Invalid login credentials" })).toMatch(
      /email and password/i,
    );
  });

  it("falls back to a generic auth error message", () => {
    expect(authMessageFromError({ message: "service unavailable" })).toMatch(/try again/i);
  });
});
