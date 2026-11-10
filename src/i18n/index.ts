import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./locales/uz.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import ko from "./locales/ko.json";

export const LANGUAGES = [
  { code: "uz", label: "O'zbekcha" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "ko", label: "한국어" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "wild-haven-lang";

function isSupported(code: string | null | undefined): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

// Avval foydalanuvchi tanlagan til, keyin brauzer tili, oxirida o'zbekcha
function detectLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isSupported(saved)) return saved;
  } catch {
    // localStorage ishlamasa (masalan, maxfiy rejim), keyingi usulga o'tamiz
  }
  const browser = navigator.language?.slice(0, 2);
  return isSupported(browser) ? browser : "uz";
}

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
    ko: { translation: ko },
  },
  lng: detectLanguage(),
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // saqlab bo'lmasa ham til joriy sessiyada almashadi
  }
});

export default i18n;
