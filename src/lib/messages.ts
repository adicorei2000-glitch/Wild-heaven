import { supabase } from "@/lib/supabase";
import { notifyBooking } from "@/lib/notify";

export interface BookingMessage {
  id: number;
  booking_id: number;
  sender_id: string;
  from_admin: boolean;
  body: string;
  created_at: string;
}

export async function fetchMessages(bookingId: number): Promise<BookingMessage[]> {
  const { data, error } = await supabase
    .from("booking_messages")
    .select("id, booking_id, sender_id, from_admin, body, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BookingMessage[];
}

// Xabar yuboradi; muvaffaqiyatli bo'lsa ikkinchi tomonga email ham so'raydi.
// Qaytaradi: null = ok, "rate" = limitga yetdi, "error" = boshqa xato.
export async function sendMessage(bookingId: number, body: string): Promise<null | "rate" | "error"> {
  const text = body.trim();
  if (!text) return "error";
  const { error } = await supabase
    .from("booking_messages")
    .insert({ booking_id: bookingId, body: text, sender_id: "00000000-0000-0000-0000-000000000000", from_admin: false });
  if (error) return error.code === "54000" ? "rate" : "error";
  notifyBooking(bookingId, "message");
  return null;
}
