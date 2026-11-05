import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Star, MapPin, CalendarIcon } from "lucide-react";
import { villas } from "@/data/villa";
import { addDays, format } from "date-fns";

type Message = { type: "error" | "success"; text: string };

function VillaDetails() {
  const { id } = useParams();
  const villa = villas.find((v) => v.id === Number(id));

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [message, setMessage] = useState<Message | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!villa) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Villa topilmadi</h1>
        <Link to="/" className="text-primary underline mt-4 inline-block">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  const total = nights * villa.price;

  const handleCheckIn = (date: Date | undefined) => {
    setCheckIn(date);
    setMessage(null);
    // Chiqish sanasi kirish sanasidan oldin qolib ketmasin
    if (date && checkOut && checkOut <= date) {
      setCheckOut(undefined);
    }
  };

  const handleCheckOut = (date: Date | undefined) => {
    setCheckOut(date);
    setMessage(null);
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
        text: "Bron qilish uchun avval tizimga kiring.",
      });
      return;
    }

    const { error } = await supabase.from("bookings").insert({
      villa_id: villa.id,
      villa_name: villa.name,
      check_in: format(checkIn, "yyyy-MM-dd"),
      check_out: format(checkOut, "yyyy-MM-dd"),
      guests: Number(guests),
      total_price: total,
      user_id: user.id,
    });

    setSubmitting(false);

    if (error) {
      setMessage({
        type: "error",
        // 23P01 — bazadagi "sanalar kesishmasin" cheklovi (supabase/bookings.sql)
        text:
          error.code === "23P01"
            ? "Bu sanalar allaqachon band. Iltimos, boshqa sanalarni tanlang."
            : "Xatolik yuz berdi: " + error.message,
      });
    } else {
      setMessage({
        type: "success",
        text: "Bron muvaffaqiyatli amalga oshirildi!",
      });
      setCheckIn(undefined);
      setCheckOut(undefined);
    }
  };

  const buttonLabel = submitting
    ? "Yuborilmoqda..."
    : !checkIn || !checkOut
      ? "Sanalarni tanlang"
      : nights < 1
        ? "Kamida 1 kecha tanlang"
        : "Bron qilish";

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="aspect-[16/7] overflow-hidden rounded-xl mb-8">
        <img
          src={villa.image}
          alt={villa.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{villa.name}</h1>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {villa.rating}
            </div>
          </div>

          <p className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {villa.location}
          </p>

          <div className="border-t pt-6">
            <p className="text-muted-foreground leading-relaxed">
              Bu villa tabiat qo'ynida joylashgan bo'lib, hashamat va tinchlikni
              birlashtiradi. Zamonaviy interyer, keng hovli va ajoyib manzara
              sizni kutmoqda. Oilaviy dam olish yoki romantik sayohat uchun
              ideal joy.
            </p>
          </div>
        </div>

        {/* Bron qilish kartasi */}
        <div className="border rounded-xl p-6 h-fit space-y-4">
          <p className="text-2xl font-bold">
            ${villa.price}{" "}
            <span className="text-muted-foreground text-base font-normal">
              / kecha
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Kirish</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "dd.MM.yyyy") : "Sana"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={handleCheckIn}
                    disabled={{ before: today }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Chiqish</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "dd.MM.yyyy") : "Sana"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={handleCheckOut}
                    disabled={{ before: checkIn ? addDays(checkIn, 1) : today }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Mehmonlar soni</label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} mehmon
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nights > 0 && (
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  ${villa.price} x {nights} kecha
                </span>
                <span>${total}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>Jami</span>
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
              {message.text}{" "}
              {message.type === "success" && (
                <Link to="/my-bookings" className="underline font-medium">
                  Bronlarimni ko'rish
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
