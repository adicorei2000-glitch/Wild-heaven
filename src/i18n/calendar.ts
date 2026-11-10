import { enUS, ko, ru, uz } from "react-day-picker/locale";

// Kalendardagi oy va hafta kunlari nomlari tanlangan tilda chiqishi uchun
export function calendarLocale(lang: string) {
  switch (lang) {
    case "ko":
      return ko;
    case "ru":
      return ru;
    case "uz":
      return uz;
    default:
      return enUS;
  }
}
