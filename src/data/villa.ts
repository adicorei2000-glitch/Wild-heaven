// Villalar endi Supabase'dagi `villas` jadvalidan o'qiladi (src/lib/villas.ts).
export interface Villa {
  id: number;
  name: string;
  location: string;
  country: string;
  price: number;
  rating: number;
  maxGuests: number;
  image: string;
  images: string[];
  description: string;
  amenities: string[];
  lat: number | null;
  lng: number | null;
}
