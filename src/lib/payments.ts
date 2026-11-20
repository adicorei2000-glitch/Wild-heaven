import { supabase } from "@/lib/supabase";

// Stripe to'lov sahifasi manzilini oladi. To'lov sozlanmagan yoki xato bo'lsa null qaytaradi.
export async function startCheckout(bookingId: number): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      booking_id: bookingId,
      return_url: `${window.location.origin}${import.meta.env.BASE_URL}`,
    },
  });
  if (error || !data?.url) return null;
  return data.url as string;
}

// Bron to'langanmi, Stripe'dan tekshiradi (to'langan bo'lsa bron tasdiqlanadi)
export async function verifyPayment(bookingId: number): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("verify-payment", {
    body: { booking_id: bookingId },
  });
  return !error && data?.paid === true;
}

// Admin: to'langan bron pulini to'liq qaytaradi (Stripe) va bronni bekor qiladi
export async function refundBooking(bookingId: number): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("refund-booking", {
    body: { booking_id: bookingId },
  });
  return !error && data?.ok === true;
}
