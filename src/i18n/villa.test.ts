import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import { amenityName, countryName, villaText } from "./villa";

// t() ning soddalashtirilgan nusxasi: kalit bo'lmasa defaultValue qaytaradi
const dict: Record<string, string> = {
  "villaData.1.name": "Quiet harbor",
  "country.Maldives": "Мальдивы",
};
const t = ((key: string, opts?: { defaultValue?: string }) =>
  dict[key] ?? opts?.defaultValue ?? key) as unknown as TFunction;

const villa = { id: 1, name: "Tinch boshpana", location: "Bali", description: "Tavsif" };

describe("villa matnlari", () => {
  it("tarjima bor bo'lsa uni ko'rsatadi", () => {
    expect(villaText(t, villa).name).toBe("Quiet harbor");
  });

  it("tarjima yo'q bo'lsa baza matniga qaytadi (yangi villa)", () => {
    const text = villaText(t, { ...villa, id: 999 });
    expect(text).toEqual({ name: "Tinch boshpana", location: "Bali", description: "Tavsif" });
  });

  it("mamlakat va qulaylik nomi: tarjima yoki o'zi", () => {
    expect(countryName(t, "Maldives")).toBe("Мальдивы");
    expect(countryName(t, "Atlantis")).toBe("Atlantis");
    expect(amenityName(t, "Wi-Fi")).toBe("Wi-Fi");
  });
});
