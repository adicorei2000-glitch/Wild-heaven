import { describe, expect, it } from "vitest";
import { isStrongPassword } from "./password";

describe("isStrongPassword", () => {
  it("rejects short, letters-only, digits-only and too long passwords", () => {
    expect(isStrongPassword("abc123")).toBe(false);
    expect(isStrongPassword("abcdefgh")).toBe(false);
    expect(isStrongPassword("12345678")).toBe(false);
    expect(isStrongPassword("a1".repeat(40))).toBe(false);
  });
  it("accepts 8+ chars with a letter and a digit (any language)", () => {
    expect(isStrongPassword("wildhaven1")).toBe(true);
    expect(isStrongPassword("Парольдлинный7")).toBe(true);
  });
});
