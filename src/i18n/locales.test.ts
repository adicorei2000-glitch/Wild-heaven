import { describe, expect, it } from "vitest";
import uz from "./locales/uz.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import ko from "./locales/ko.json";

const locales = { uz, en, ru, ko } as const;

type Json = string | Json[] | { [k: string]: Json };

function flatten(obj: Json, prefix = ""): Record<string, string> {
  if (typeof obj === "string") return { [prefix]: obj };
  return Object.entries(obj).reduce<Record<string, string>>(
    (acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }),
    {},
  );
}

// "bookingsCount_one" / "_few" / "_many" / "_other" -> bitta asosiy kalit (har tilda turli shakllar bor)
const baseKey = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, "");
const placeholders = (s: string) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

const flat = Object.fromEntries(
  Object.entries(locales).map(([lang, data]) => [lang, flatten(data as Json)]),
);
// Villa va mamlakat nomlarining o'zbekchasi bazada turadi, shuning uchun villaData va country faqat en/ru/ko da bor
const isDbText = (k: string) => k.startsWith("villaData.") || k.startsWith("country.");
const keysOf = (lang: string, villaData = false) =>
  new Set(
    Object.keys(flat[lang])
      .filter((k) => isDbText(k) === villaData)
      .map(baseKey),
  );

describe("tarjimalar", () => {
  const reference = keysOf("uz");

  for (const lang of ["en", "ru", "ko"]) {
    it(`${lang}: uz bilan bir xil kalitlar`, () => {
      const keys = keysOf(lang);
      const missing = [...reference].filter((k) => !keys.has(k));
      const extra = [...keys].filter((k) => !reference.has(k));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  }

  for (const lang of Object.keys(locales)) {
    it(`${lang}: bo'sh matn yo'q`, () => {
      const empty = Object.entries(flat[lang]).filter(([, v]) => v.trim() === "");
      expect(empty).toEqual([]);
    });
  }

  it("villaData va country: en, ru, ko da bir xil kalitlar", () => {
    const en = keysOf("en", true);
    for (const lang of ["ru", "ko"]) {
      const keys = keysOf(lang, true);
      expect({
        lang,
        missing: [...en].filter((k) => !keys.has(k)),
        extra: [...keys].filter((k) => !en.has(k)),
      }).toEqual({ lang, missing: [], extra: [] });
    }
  });

  it("{{o'zgaruvchi}} nomlari hamma tillarda mos", () => {
    const problems: string[] = [];
    for (const [key, value] of Object.entries(flat.uz)) {
      const base = baseKey(key);
      const expected = placeholders(value);
      for (const lang of ["en", "ru", "ko"]) {
        for (const [k, v] of Object.entries(flat[lang])) {
          if (baseKey(k) !== base) continue;
          // faqat son (count) bo'lmagan o'zgaruvchilar mos bo'lishi shart
          const got = placeholders(v).filter((p) => p !== "count");
          const want = expected.filter((p) => p !== "count");
          if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${lang}:${k}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("rus tilida ko'plik shakllari to'liq", () => {
    const plural = Object.keys(flat.ru).filter((k) => k.endsWith("_few"));
    for (const k of plural) {
      const b = baseKey(k);
      for (const form of ["one", "few", "many", "other"]) {
        expect(flat.ru[`${b}_${form}`], `${b}_${form}`).toBeTruthy();
      }
    }
  });
});
