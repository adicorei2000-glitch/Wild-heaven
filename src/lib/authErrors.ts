import type { TFunction } from "i18next";

// Supabase Auth xatolarini tanlangan tilda ko'rsatadi. Noma'lum xato bo'lsa, asl matn qaytariladi.
const KNOWN = new Set([
  "same_password",
  "weak_password",
  "user_already_exists",
  "email_exists",
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "email_not_confirmed",
  "invalid_credentials",
  "email_address_invalid",
  "reauthentication_needed",
  "session_expired",
  "session_not_found",
  "signup_disabled",
]);

export function authErrorText(t: TFunction, error: { message: string; code?: string }): string {
  const code = error.code && KNOWN.has(error.code) ? error.code : undefined;
  if (code) return t(`authErrors.${code}`, { defaultValue: error.message });
  // Eski versiyalarda kod bo'lmasligi mumkin: matn bo'yicha taxmin
  const m = error.message.toLowerCase();
  if (m.includes("different from the old password")) return t("authErrors.same_password");
  if (m.includes("already registered")) return t("authErrors.user_already_exists");
  if (m.includes("rate limit")) return t("authErrors.over_request_rate_limit");
  return error.message;
}
