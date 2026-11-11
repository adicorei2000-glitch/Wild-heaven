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
