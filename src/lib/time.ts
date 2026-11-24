// "HH:MM" (24 soatlik) vaqtni tanlangan til qoidasiga ko'ra chiroyli ko'rsatadi:
// en: 12:00 PM, 1:00 AM; ko: 오후 12:00; ru/uz: 12:00, 01:00
export function formatTime(hhmm: string, lang: string): string {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  if (!Number.isInteger(h) || !Number.isInteger(m)) return hhmm;
  const d = new Date(2000, 0, 1, h, m);
  try {
    const h12 = lang === "en" || lang === "ko";
    return new Intl.DateTimeFormat(lang, {
      hour: h12 ? "numeric" : "2-digit",
      minute: "2-digit",
      hourCycle: h12 ? "h12" : "h23",
    }).format(d);
  } catch {
    return hhmm;
  }
}

// Bazadan kelgan "14:00:00" ni "14:00" ga keltiradi; noto'g'ri bo'lsa standart qiymat
export function normalizeTime(v: string | null | undefined, fallback: string): string {
  const m = /^(\d{2}):(\d{2})/.exec(v ?? "");
  return m ? `${m[1]}:${m[2]}` : fallback;
}
