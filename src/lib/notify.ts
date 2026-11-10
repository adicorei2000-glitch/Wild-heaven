import { supabase } from "@/lib/supabase";

// Email yuborishni so'raydi (Edge Function: notify-booking).
// Xat yuborilmasa ham bron jarayoniga ta'sir qilmaydi.
export function notifyBooking(bookingId: number, event: "created" | "status") {
  supabase.functions
    .invoke("notify-booking", { body: { booking_id: bookingId, event } })
    .catch(() => {});
}
