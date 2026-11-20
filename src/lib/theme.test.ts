import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTheme } from "./theme";

function stubBrowser(saved: string | null, prefersDark: boolean) {
  vi.stubGlobal("localStorage", { getItem: () => saved, setItem: () => {} });
  vi.stubGlobal("window", { matchMedia: () => ({ matches: prefersDark }) });
}

describe("getTheme", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("saqlangan tanlovni qaytaradi", () => {
    stubBrowser("dark", false);
    expect(getTheme()).toBe("dark");
    stubBrowser("light", true);
    expect(getTheme()).toBe("light");
  });

  it("saqlanmagan bo'lsa tizim sozlamasiga qaraydi", () => {
    stubBrowser(null, true);
    expect(getTheme()).toBe("dark");
    stubBrowser(null, false);
    expect(getTheme()).toBe("light");
  });

  it("noto'g'ri qiymatni e'tiborsiz qoldiradi", () => {
    stubBrowser("blue", false);
    expect(getTheme()).toBe("light");
  });
});
