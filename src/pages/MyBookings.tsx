import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface Booking {
  id: number;
  villa_id: number;
  villa_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  created_at: string;
}

function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookings(data);
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleCancel = async (id: number) => {
    const confirmed = confirm("Bronni bekor qilishni tasdiqlaysizmi?");
    if (!confirmed) return;

    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (!error) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">
          Bronlaringizni ko'rish uchun kiring
        </h1>
        <Link to="/login">
          <Button>Kirish</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Mening bronlarim</h1>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">
          Sizda hali bron qilingan joy yo'q.
        </p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h2 className="text-lg font-semibold">{booking.villa_name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {booking.check_in} — {booking.check_out} · {booking.guests}{" "}
                  mehmon
                </p>
                <p className="text-sm font-medium mt-1">
                  ${booking.total_price}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleCancel(booking.id)}
              >
                Bekor qilish
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
