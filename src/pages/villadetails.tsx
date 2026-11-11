import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import type { Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import FavoriteButton from "@/components/ui/favorite-button";
import { supabase } from "@/lib/supabase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, CalendarIcon, Check, Users } from "lucide-react";
import { addDays, format } from "date-fns";
import { fetchBookedRanges, fetchVilla, type BookedRange } from "@/lib/villas";
import { useFavorites } from "@/lib/useFavorites";
import { notifyBooking } from "@/lib/notify";
import Reviews from "@/components/ui/reviews";
import VillaMap from "@/components/ui/villa-map";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { villaText, amenityName } from "@/i18n/villa";
import { calendarLocale } from "@/i18n/calendar";
import type { Villa } from "@/data/villa";

type Message = {
  type: "error" | "success";
  key: string;
  detail?: string;
  login?: boolean;
};

function VillaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const villaId = Number(id);
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavorites();

  const [villa, setVilla] = useState<Villa | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [booked, setBooked] = useState<BookedRange[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [message, setMessage] = useState<Message | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setActiveImage(0);

    if (!Number.isFinite(villaId)) {
      setVilla(null);
      setLoading(false);
      return;
    }

    Promise.all([
      fetchVilla(villaId),
      fetchBookedRanges(villaId).catch(() => [] as BookedRange[]),
    ])
      .then(([v, ranges]) => {
        if (cancelled) return;
        setVilla(v);
        setBooked(ranges);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [villaId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 animate-pulse space-y-6">
        <div className="aspect-[16/7] rounded-xl bg-muted" />
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-2xl font-bold">{t("villa.loadFailed")}</h1>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Link to="/" className="text-primary underline inline-block">
          {t("villa.backHome")}
        </Link>
      </div>
    );
  }

  if (!villa) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("villa.notFound")}</h1>
        <Link to="/" className="text-primary underline mt-4 inline-block">
          {t("villa.backHome")}
        </Link>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const guestCount = Math.min(Number(guests) || 1, villa.maxGuests);

  // Keyingi band bronning kirish sanasi (shu sanagacha chiqib ketish mumkin)
  const nextBookingAfter = (date: Date): Date | undefined =>
    booked
      .map((r) => r.checkIn)
      .filter((d) => d > date)
      .sort((a, b) => a.getTime() - b.getTime())[0];

  // Band kechalar: kirishdan chiqishgacha, chiqish kunining o'zi bo'sh
  const bookedNights: Matcher[] = booked.map((r) => ({
    from: r.checkIn,
    to: addDays(r.checkOut, -1),
  }));

  const checkInDisabled: Matcher[] = [{ before: today }, ...bookedNights];

  const maxCheckOut = checkIn ? nextBookingAfter(checkIn) : undefined;
  const checkOutDisabled: Matcher[] = [
    { before: addDays(checkIn ?? today, 1) },
    ...(maxCheckOut ? [{ after: maxCheckOut }] : []),
  ];

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  // Faqat ko'rsatish uchun: haqiqiy narxni bazadagi trigger hisoblaydi
  const total = nights * villa.price;

  const handleCheckIn = (date: Date | undefined) => {
    setCheckIn(date);
    setMessage(null);

    if (date && checkOut) {
      const limit = nextBookingAfter(date);
      if (checkOut <= date || (limit && checkOut > limit)) {
        setCheckOut(undefined);
      }
    }
  };

  const handleCheckOut = (date: Date | undefined) => {
    setCheckOut(date);
    setMessage(null);
  };

  const handleFavorite = async () => {
    const result = await toggleFavorite(villa.id);
    if (result === "login") navigate("/login");
  };

  const handleBooking = async () => {
    if (!checkIn || !checkOut || nights < 1) return;

    setMessage(null);
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setMessage({
        type: "error",
        key: "villa.loginToBook",
        login: true,
      });
      return;
    }

    const { data: created, error } = await supabase.from("bookings").insert({
      villa_id: villa.id,
      villa_name: villa.name,
      check_in: format(checkIn, "yyyy-MM-dd"),
      check_out: format(checkOut, "yyyy-MM-dd"),
      guests: guestCount,
      total_price: total,
      user_id: user.id,
      lang: i18n.resolvedLanguage ?? "uz",
    }).select("id").single();

    setSubmitting(false);

    if (error) {
      setMessage({
        type: "error",
        // 23P01 — bazadagi "sanalar kesishmasin" cheklovi
        key: error.code === "23P01" ? "villa.alreadyBooked" : "villa.bookingFailed",
        detail: error.message,
      });
      // Kimdir shu orada band qilgan bo'lishi mumkin: kalendarni yangilaymiz
      fetchBookedRanges(villa.id).then(setBooked).catch(() => {});
    } else {
      if (created) notifyBooking(created.id, "created");
      setMessage({
        type: "success",
        key: "villa.bookingSuccess",
      });
      setCheckIn(undefined);
      setCheckOut(undefined);
      fetchBookedRanges(villa.id).then(setBooked).catch(() => {});
    }
  };

  const buttonLabel = submitting
    ? t("villa.btnSubmitting")
    : !checkIn || !checkOut
      ? t("villa.btnPickDates")
      : nights < 1
        ? t("villa.btnMinNight")
        : t("villa.btnBook");

  const images = villa.images;
  const text = villaText(t, villa);
  const calLocale = calendarLocale(i18n.resolvedLanguage ?? "uz");

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Galereya */}
      <div className="mb-8 space-y-3">
        <div className="relative aspect-[16/7] overflow-hidden rounded-xl">
          <img
            src={images[activeImage] ?? villa.image}
            alt={text.name}
            className="h-full w-full object-cover"
          />
          <FavoriteButton
            active={favoriteIds.has(villa.id)}
            onToggle={handleFavorite}
            className="absolute top-4 right-4"
          />
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, index) => (
              <button
                key={src + index}
                type="button"
                aria-label={t("villa.imageN", { n: index + 1 })}
                onClick={() => setActiveImage(index)}
                className={cn(
                  "h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity",
                  index === activeImage
                    ? "border-primary"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{text.name}</h1>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {villa.rating}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-muted-foreground">
            <p className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {text.location}
            </p>
            <p className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {t("villa.maxGuests", { count: villa.maxGuests })}
            </p>
          </div>

          <div className="border-t pt-6">
            <p className="text-muted-foreground leading-relaxed">
              {text.description}
            </p>
          </div>

          {villa.amenities.length > 0 && (
            <div className="border-t pt-6 space-y-3">
              <h2 className="text-xl font-semibold">{t("villa.amenities")}</h2>
              <ul className="grid grid-cols-2 gap-y-2 sm:grid-cols-3">
                {villa.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {amenityName(t, amenity)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {villa.lat !== null && villa.lng !== null && (
            <VillaMap lat={villa.lat} lng={villa.lng} title={text.name} />
          )}

          <Reviews
            villaId={villa.id}
            onChanged={() => fetchVilla(villa.id).then((v) => v && setVilla(v))}
          />
        </div>

        {/* Bron qilish kartasi */}
        <div className="border rounded-xl p-6 h-fit space-y-4">
          <p className="text-2xl font-bold">
            ${villa.price}{" "}
            <span className="text-muted-foreground text-base font-normal">
              {t("common.perNight")}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">{t("villa.checkIn")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "dd.MM.yyyy") : t("villa.date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    locale={calLocale}
                    selected={checkIn}
                    onSelect={handleCheckIn}
                    disabled={checkInDisabled}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">{t("villa.checkOut")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "dd.MM.yyyy") : t("villa.date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    locale={calLocale}
                    selected={checkOut}
                    onSelect={handleCheckOut}
                    disabled={checkOutDisabled}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">{t("villa.guestsLabel")}</label>
            <Select value={String(guestCount)} onValueChange={setGuests}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: villa.maxGuests }, (_, i) => i + 1).map(
                  (n) => (
                    <SelectItem key={n} value={String(n)}>
                      {t("villa.guestOption", { count: n })}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {nights > 0 && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  ${villa.price} x {t("villa.nights", { count: nights })}
                </span>
                <span>${total}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>{t("villa.total")}</span>
                <span>${total}</span>
              </div>
            </div>
          )}

          {message && (
            <p
              role={message.type === "error" ? "alert" : "status"}
              className={
                message.type === "error"
                  ? "text-sm text-red-500"
                  : "text-sm text-green-600"
              }
            >
              {t(message.key, { message: message.detail })}{" "}
              {message.login && (
                <Link to="/login" className="underline font-medium">
                  {t("nav.login")}
                </Link>
              )}
              {message.type === "success" && (
                <Link to="/my-bookings" className="underline font-medium">
                  {t("villa.viewBookings")}
                </Link>
              )}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!checkIn || !checkOut || nights < 1 || submitting}
            onClick={handleBooking}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VillaDetails;
