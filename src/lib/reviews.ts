import { supabase } from "@/lib/supabase";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author: string;
  mine: boolean;
  images: string[];
}

export const MAX_REVIEW_PHOTOS = 3;
const BUCKET = "review-images";

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

// Rasmni kichraytirib (eng uzun tomoni 1600px) JPEG qiladi: tez yuklanadi, 3 MB limitga sig'adi
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("image");
  return blob;
}

// Rasmlarni <user_id>/<tasodifiy>.jpg ko'rinishida yuklaydi va ochiq manzillarini qaytaradi
export async function uploadReviewImages(userId: string, files: File[]): Promise<string[]> {
  const urls: string[] = [];
  try {
    for (const file of files.slice(0, MAX_REVIEW_PHOTOS)) {
      const blob = await compressImage(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: "image/jpeg",
      });
      if (error) throw new Error(error.message);
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
  } catch (e) {
    await removeReviewImages(urls);
    throw e;
  }
  return urls;
}

export async function removeReviewImages(urls: string[]) {
  const marker = `/${BUCKET}/`;
  const paths = urls.map((u) => u.split(marker)[1]).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
}

export async function submitReview(input: {
  villaId: number;
  bookingId: number;
  rating: number;
  comment: string;
  images?: string[];
}) {
  const { error } = await supabase.from("reviews").insert({
    villa_id: input.villaId,
    booking_id: input.bookingId,
    rating: input.rating,
    comment: input.comment.trim(),
    images: input.images ?? [],
  });
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: number, images: string[] = []) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await removeReviewImages(images);
}
