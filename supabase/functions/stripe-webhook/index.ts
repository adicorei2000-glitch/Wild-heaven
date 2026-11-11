// Stripe webhook: to'lov muvaffaqiyatli bo'lsa broni tasdiqlaydi.
// Imzo tekshiriladi (STRIPE_WEBHOOK_SECRET). verify_jwt = false (Stripe JWT yubormaydi).
import { createClient } from "npm:@supabase/supabase-js@2";

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

async function validSignature(raw: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${raw}`)));
  return sigs.some((s) => {
    if (s.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < s.length; i++) diff |= s.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("not configured", { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  if (!(await validSignature(raw, sig, secret))) return new Response("bad signature", { status: 400 });

  const event = JSON.parse(raw);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object;
    const id = Number(s?.metadata?.booking_id);
    if (s?.payment_status === "paid" && Number.isInteger(id)) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: b } = await admin.from("bookings").select("id, status, paid_at").eq("id", id).maybeSingle();
      if (b && !b.paid_at) {
        // Bron allaqachon bekor qilingan bo'lsa tiklamaymiz (pul qaytarish qo'lda kerak bo'ladi)
        const patch: Record<string, unknown> = { paid_at: new Date().toISOString(), stripe_session_id: s.id };
        if (b.status === "pending") patch.status = "confirmed";
        await admin.from("bookings").update(patch).eq("id", id);
        if (b.status === "cancelled") console.warn(`Booking ${id} was cancelled but paid (session ${s.id}): refund needed`);
      }
    }
  }
  return new Response("ok", { status: 200 });
});
