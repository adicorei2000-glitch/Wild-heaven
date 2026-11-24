import { describe, expect, it } from "vitest";
import { formatTime, normalizeTime } from "./time";

describe("time helpers", () => {
  it("formats noon and 1 AM per language", () => {
    expect(formatTime("12:00", "en")).toMatch(/12:00\s?PM/i);
    expect(formatTime("01:00", "en")).toMatch(/1:00\s?AM/i);
    expect(formatTime("01:00", "ru")).toBe("01:00");
    expect(formatTime("00:30", "uz")).toBe("00:30");
  });
  it("normalizes db values", () => {
    expect(normalizeTime("14:00:00", "11:00")).toBe("14:00");
    expect(normalizeTime(null, "11:00")).toBe("11:00");
    expect(normalizeTime("bad", "11:00")).toBe("11:00");
  });
});
