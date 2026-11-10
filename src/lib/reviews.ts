import { supabase } from "@/lib/supabase";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: string;
  mine: boolean;
}

export async function fetchReviews(villaId: number): Promise<Review[]> {
  const { data, error } = await supabase.rpc("get_villa_reviews", {
    p_villa_id: villaId,
  });
  if (error) throw new Error(error.message);
  return data as Review[];
}

// Foydalanuvchining shu villadagi, hali sharh yozilmagan yakunlangan broni (bo'lsa)
export async function fetchReviewableBookingId(
  villaId: number,
  userId: string,
): Promise<number | null> {
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: bookings }, { data: reviewed }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id")
      .eq("user_id", userId)
      .eq("villa_id", villaId)
      .eq("status", "confirmed")
      .lte("check_out", today)
      .order("check_out", { ascending: false }),
    supabase.from("reviews").select("booking_id").eq("villa_id", villaId),
  ]);
  const done = new Set((reviewed ?? []).map((r) => r.booking_id as number));
  const free = (bookings ?? []).find((b) => !done.has(b.id as number));
  return free ? (free.id as number) : null;
}

export async function submitReview(input: {
  villaId: number;
  bookingId: number;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase.from("reviews").insert({
    villa_id: input.villaId,
    booking_id: input.bookingId,
    rating: input.rating,
    comment: input.comment.trim(),
  });
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: number) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
