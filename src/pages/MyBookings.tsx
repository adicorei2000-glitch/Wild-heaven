import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { fetchVillas } from "@/lib/villas";
import { startCheckout } from "@/lib/payments";
import { villaText } from "@/i18n/villa";
import type { Villa } from "@/data/villa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "cancelled";

interface Booking {
  id: number;
  villa_id: number;
  villa_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: Status;
  created_at: string;
  paid_at: string | null;
}

const today = () => format(new Date(), "yyyy-MM-dd");

function getBadge(booking: Booking) {
  if (booking.status === "cancelled") {
    return { key: "bookings.statusCancelled", className: "bg-red-100 text-red-700" };
  }
  if (booking.check_out < today()) {
    return {
      key: "bookings.statusCompleted",
      className: "bg-muted text-muted-foreground",
    };
  }
  if (booking.status === "pending") {
    return {
      key: "bookings.statusPending",
      className: "bg-yellow-100 text-yellow-800",
    };
  }
  return {
    key: "bookings.statusConfirmed",
    className: "bg-green-100 text-green-700",
  };
}

function MyBookings() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [villaById, setVillaById] = useState<Map<number, Villa>>(new Map());
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

      // Villa nomi tanlangan tilda chiqishi uchun villalarni ham olamiz
      fetchVillas()
        .then((villas) => setVillaById(new Map(villas.map((v) => [v.id, v]))))
        .catch(() => {});

      setLoading(false);
    };

    load();
  }, []);

  // To'lovdan qaytgach webhook kechikishi mumkin: statusni qayta o'qiymiz
  useEffect(() => {
    if (params.get("paid") !== "1" || !user) return;
    const refresh = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setBookings(data);
    };
    const timers = [3000, 8000].map((ms) => setTimeout(refresh, ms));
    return () => timers.forEach(clearTimeout);
  }, [params, user]);

  const handlePay = async (id: number) => {
    const url = await startCheckout(id);
    if (url) window.location.href = url;
    else alert(t("pay.unavailable"));
  };

  const handleCancel = async (id: number) => {
    const confirmed = confirm(t("bookings.confirmCancel"));
    if (!confirmed) return;

    if (!user) return;

    // Bazadagi cancel_booking() faqat foydalanuvchining o'z bronini bekor qiladi
    const { error } = await supabase.rpc("cancel_booking", {
      p_booking_id: id,
    });

    if (error) {
      alert(t("bookings.cancelFailed", { message: error.message }));
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("bookings.loginPrompt")}</h1>
        <Link to="/login">
          <Button>{t("nav.login")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{t("bookings.title")}</h1>

      {params.get("paid") === "1" && (
        <p role="status" className="mb-6 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-800">
          {t("pay.successBanner")}
        </p>
      )}
      {params.get("cancelled") === "1" && (
        <p role="status" className="mb-6 rounded-lg bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          {t("pay.cancelledBanner")}
        </p>
      )}

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">{t("bookings.empty")}</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const badge = getBadge(booking);
            const isCancelled = booking.status === "cancelled";
            const canCancel = !isCancelled && booking.check_out > today();
            const villa = villaById.get(booking.villa_id);
            const villaName = villa
              ? villaText(t, villa).name
              : booking.villa_name;

            return (
              <div
                key={booking.id}
                className={cn(
                  "border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
                  isCancelled && "opacity-60",
                )}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{villaName}</h2>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        badge.className,
                      )}
                    >
                      {t(badge.key)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {booking.check_in} — {booking.check_out} ·{" "}
                    {t("bookings.guestsLine", { count: booking.guests })}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium mt-1",
                      isCancelled && "line-through",
                    )}
                  >
                    ${booking.total_price}
                    {booking.paid_at && <span className="ml-2 no-underline text-green-700">· {t("pay.paid")}</span>}
                  </p>
                </div>
                {booking.status === "pending" && !booking.paid_at && (
                  <Button onClick={() => handlePay(booking.id)}>{t("pay.payNow")}</Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={() => handleCancel(booking.id)}
                  >
                    {t("bookings.cancel")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;
