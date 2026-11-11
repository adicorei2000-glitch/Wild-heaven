import { parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Villa } from "@/data/villa";

interface VillaRow {
  id: number;
  name: string;
  location: string;
  country: string;
  price: number | string;
  rating: number | string;
  max_guests: number;
  image: string;
  images: string[] | null;
  description: string;
  amenities: string[] | null;
  lat: number | null;
  lng: number | null;
}

function toVilla(row: VillaRow): Villa {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    country: row.country,
    price: Number(row.price),
    rating: Number(row.rating),
    maxGuests: row.max_guests,
    image: row.image,
    images: row.images && row.images.length > 0 ? row.images : [row.image],
    description: row.description,
    amenities: row.amenities ?? [],
    lat: row.lat,
    lng: row.lng,
  };
}

export async function fetchVillas(): Promise<Villa[]> {
  const { data, error } = await supabase
    .from("villas")
    .select("*")
    .order("id");
  if (error) throw new Error(error.message);
  return (data as VillaRow[]).map(toVilla);
}

export async function fetchVilla(id: number): Promise<Villa | null> {
  const { data, error } = await supabase
    .from("villas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toVilla(data as VillaRow) : null;
}

export interface BookedRange {
  checkIn: Date;
  checkOut: Date;
}

// Band sanalar (faqat sanalar, kim bron qilgani ko'rinmaydi).
// Chiqish kuni band hisoblanmaydi: yangi bron shu kuni kirishi mumkin.
export async function fetchBookedRanges(villaId: number): Promise<BookedRange[]> {
  const { data, error } = await supabase.rpc("get_booked_ranges", {
    p_villa_id: villaId,
  });
  if (error) throw new Error(error.message);
  return (data as { check_in: string; check_out: string }[]).map((r) => ({
    checkIn: parseISO(r.check_in),
    checkOut: parseISO(r.check_out),
  }));
}
