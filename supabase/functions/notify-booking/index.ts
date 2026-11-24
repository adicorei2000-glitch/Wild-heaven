// Bron haqida email yuboradi (Resend orqali).
// Secrets (Supabase → Edge Functions → Secrets): RESEND_API_KEY, ADMIN_EMAIL, FROM_EMAIL (ixtiyoriy)
import { createClient } from "npm:@supabase/supabase-js@2";

type Lang = "uz" | "en" | "ru" | "ko";
const LANGS: Lang[] = ["uz", "en", "ru", "ko"];

// CORS: faqat ruxsat etilgan saytlar (ALLOWED_ORIGINS secret yoki standart ro'yxat)
const ALLOWED = (
  Deno.env.get("ALLOWED_ORIGINS") ??
  "https://adicorei2000-glitch.github.io,http://localhost:5173,http://localhost:4173"
).split(",").map((s) => s.trim());
function corsFor(req: Request) {
  const o = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0],
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}


const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

interface Booking {
  id: number;
  villa_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  lang: Lang;
  user_email: string | null;
}

type Kind = "received" | "confirmed" | "cancelled" | "admin";

// [mavzu, sarlavha, matn]
const T: Record<Lang, Record<Kind, [string, string, string]>> = {
  uz: {
    received: ["Broningiz qabul qilindi", "Bron so'rovi qabul qilindi", "Tez orada tasdiqlanadi. Tasdiqlanganda sizga yana xabar yuboramiz."],
    confirmed: ["Broningiz tasdiqlandi", "Bron tasdiqlandi", "Broningiz tasdiqlandi. Sizni kutib qolamiz!"],
    cancelled: ["Broningiz bekor qilindi", "Bron bekor qilindi", "Afsuski, broningiz bekor qilindi."],
    admin: ["Yangi bron", "Yangi bron keldi", "Yangi bron tasdiqlashni kutmoqda. Admin panelda tasdiqlang yoki rad eting."],
  },
  en: {
    received: ["Your booking request was received", "Booking request received", "It will be confirmed shortly. We'll email you again once it is."],
    confirmed: ["Your booking is confirmed", "Booking confirmed", "Your booking is confirmed. We look forward to hosting you!"],
    cancelled: ["Your booking was cancelled", "Booking cancelled", "Unfortunately, your booking was cancelled."],
    admin: ["New booking", "New booking received", "A new booking is waiting for confirmation. Confirm or reject it in the admin panel."],
  },
  ru: {
    received: ["Ваша заявка на бронирование принята", "Заявка принята", "Скоро она будет подтверждена. Мы напишем вам, когда это произойдёт."],
    confirmed: ["Ваше бронирование подтверждено", "Бронирование подтверждено", "Ваше бронирование подтверждено. Будем рады вас видеть!"],
    cancelled: ["Ваше бронирование отменено", "Бронирование отменено", "К сожалению, ваше бронирование было отменено."],
    admin: ["Новое бронирование", "Новое бронирование", "Новое бронирование ожидает подтверждения. Подтвердите или отклоните его в админ-панели."],
  },
  ko: {
    received: ["예약 요청이 접수되었습니다", "예약 요청 접수", "곧 확정됩니다. 확정되면 다시 안내해 드리겠습니다."],
    confirmed: ["예약이 확정되었습니다", "예약 확정", "예약이 확정되었습니다. 방문을 기다리겠습니다!"],
    cancelled: ["예약이 취소되었습니다", "예약 취소", "죄송합니다. 예약이 취소되었습니다."],
    admin: ["새 예약", "새 예약이 접수되었습니다", "새 예약이 확정을 기다리고 있습니다. 관리자 패널에서 확정하거나 거절하세요."],
  },
};

// Xabar emaili: [mavzu, sarlavha]
const MSG: Record<Lang, [string, string]> = {
  uz: ["Egadan yangi xabar", "Wild Haven egasidan yangi xabar"],
  en: ["New message from the host", "New message from the Wild Haven host"],
  ru: ["Новое сообщение от владельца", "Новое сообщение от владельца Wild Haven"],
  ko: ["호스트의 새 메시지", "Wild Haven 호스트의 새 메시지"],
};

const LABELS: Record<Lang, [string, string, string]> = {
  uz: ["Sanalar", "Mehmonlar", "Jami"],
  en: ["Dates", "Guests", "Total"],
  ru: ["Даты", "Гостей", "Итого"],
  ko: ["날짜", "인원", "합계"],
};

function render(kind: Kind, lang: Lang, b: Booking, guestEmail?: string | null) {
  const [subject, title, text] = T[lang][kind];
  const [d, g, tot] = LABELS[lang];
  const extra = kind === "admin" && guestEmail ? `<p><b>Email:</b> ${esc(guestEmail)}</p>` : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
<h2>${esc(title)}</h2><p>${esc(text)}</p>
<p><b>${esc(b.villa_name)}</b></p>
<p>${d}: ${esc(b.check_in)} — ${esc(b.check_out)}<br>${g}: ${b.guests}<br>${tot}: $${b.total_price}</p>${extra}
<p style="color:#888;font-size:12px">Wild Haven</p></div>`;
  return { subject: `Wild Haven: ${subject}`, html };
}

async function send(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { ok: false, error: "RESEND_API_KEY sozlanmagan" };
  const from = Deno.env.get("FROM_EMAIL") ?? "Wild Haven <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
  return { ok: true };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return json({ error: "unauthorized" }, 401);

  let body: { booking_id?: number; event?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const id = Number(body.booking_id);
  if (!Number.isInteger(id) || (body.event !== "created" && body.event !== "status" && body.event !== "message")) {
    return json({ error: "bad request" }, 400);
  }

  const results: Record<string, unknown> = {};

  if (body.event === "created") {
    // Faqat o'z broni (RLS)
    const { data } = await supabase
      .from("bookings")
      .select("id, villa_name, check_in, check_out, guests, total_price, status, lang")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return json({ error: "not found" }, 404);
    // Email bir bron uchun faqat bir marta va faqat yangi bron uchun yuboriladi (spamga qarshi)
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: claim } = await svc
      .from("bookings")
      .update({ created_emailed_at: new Date().toISOString() })
      .eq("id", id)
      .is("created_emailed_at", null)
      .gt("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString())
      .select("id");
    if (!claim || claim.length === 0) return json({ ok: true, results });
    const b = { ...data, user_email: user.email ?? null } as Booking;
    const lang: Lang = LANGS.includes(b.lang) ? b.lang : "uz";

    const admin = Deno.env.get("ADMIN_EMAIL");
    if (admin) {
      const m = render("admin", "uz", b, user.email);
      results.admin = await send(admin, m.subject, m.html);
    }
    if (user.email) {
      const m = render("received", lang, b);
      results.guest = await send(user.email, m.subject, m.html);
    }
  } else if (body.event === "message") {
    // Eng so'nggi xabar chaqiruvchining o'ziniki va hali emaillanmagan bo'lsa, ikkinchi tomonga xabar beramiz
    const { data: m } = await supabase
      .from("booking_messages")
      .select("id, body, from_admin, sender_id, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!m || m.sender_id !== user.id) return json({ ok: true, results });
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: claimed } = await service
      .from("booking_messages")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", m.id)
      .is("emailed_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) return json({ ok: true, results });

    const wrap = (title: string, villa: string, text: string) =>
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto"><h2>${esc(title)}</h2>
<p><b>${esc(villa)}</b></p><blockquote style="border-left:3px solid #ccc;margin:0;padding-left:12px;white-space:pre-wrap">${esc(text)}</blockquote>
<p style="color:#888;font-size:12px">Wild Haven</p></div>`;

    if (!m.from_admin) {
      const { data: bk } = await supabase.from("bookings").select("villa_name").eq("id", id).maybeSingle();
      const admin = Deno.env.get("ADMIN_EMAIL");
      if (admin && bk) {
        results.admin = await send(
          admin,
          "Wild Haven: Yangi xabar",
          wrap(`Yangi xabar (${user.email ?? ""})`, bk.villa_name, m.body),
        );
      }
    } else {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (isAdmin !== true) return json({ error: "forbidden" }, 403);
      const { data: list } = await supabase.rpc("admin_list_bookings");
      const b = (list as Booking[] | null)?.find((x) => x.id === id);
      if (b?.user_email) {
        const lang: Lang = LANGS.includes(b.lang) ? b.lang : "uz";
        const [subject, title] = MSG[lang];
        results.guest = await send(b.user_email, `Wild Haven: ${subject}`, wrap(title, b.villa_name, m.body));
      }
    }
  } else {
    // Status o'zgarishi: faqat admin
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin !== true) return json({ error: "forbidden" }, 403);
    const { data: list } = await supabase.rpc("admin_list_bookings");
    const b = (list as Booking[] | null)?.find((x) => x.id === id);
    if (!b) return json({ error: "not found" }, 404);
    const kind: Kind | null =
      b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : null;
    if (kind && b.user_email) {
      const lang: Lang = LANGS.includes(b.lang) ? b.lang : "uz";
      const m = render(kind, lang, b);
      results.guest = await send(b.user_email, m.subject, m.html);
    }
  }

  return json({ ok: true, results });
});
