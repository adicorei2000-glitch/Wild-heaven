import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DateRange, Matcher } from "react-day-picker";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { fetchBookedRanges, type BookedRange } from "@/lib/villas";
import { verifyPayment } from "@/lib/payments";
import { calendarLocale } from "@/i18n/calendar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props {
  booking: { id: number; villa_id: number; check_in: string; check_out: string; paid_at: string | null };
  onChanged: () => void;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

// Mehmon bron sanasini o'zgartiradi. Qoidalar bazada (change_booking_dates), bu yerda faqat qulay interfeys.
function ChangeDatesDialog({ booking, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [booked, setBooked] = useState<BookedRange[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [minNights, setMinNights] = useState(1);

  const ownIn = parseISO(booking.check_in);
  const ownOut = parseISO(booking.check_out);
  const nights = differenceInCalendarDays(ownOut, ownIn);
  const paid = booking.paid_at !== null;

  useEffect(() => {
    if (!open) return;
    setRange({ from: ownIn, to: ownOut });
    setError("");
    supabase
      .from("villas")
      .select("min_nights")
      .eq("id", booking.villa_id)
      .maybeSingle()
      .then(({ data }) => setMinNights(data?.min_nights ?? 1));
    fetchBookedRanges(booking.villa_id)
      .then((r) =>
        // O'z broningizning sanalari to'siq bo'lmasin
        setBooked(r.filter((x) => !(iso(x.checkIn) === booking.check_in && iso(x.checkOut) === booking.check_out))),
      )
      .catch(() => setBooked([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const disabled: Matcher[] = [
    { before: new Date() },
    ...booked.map((r) => ({ from: r.checkIn, to: addDays(r.checkOut, -1) })),
  ];

  const newNights = range?.from && range.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const nightsOk = newNights >= 1 && (paid ? newNights === nights : newNights >= minNights);

  const save = async () => {
    if (!range?.from || !range.to || !nightsOk) return;
    setBusy(true);
    setError("");
    // To'lov boshlangan bo'lsa, avval to'langanini tekshiramiz (to'lovni yo'qotib qo'ymaslik uchun)
    if (!paid && (await verifyPayment(booking.id))) {
      setBusy(false);
      setOpen(false);
      onChanged();
      return;
    }
    const { error: err } = await supabase.rpc("change_booking_dates", {
      p_booking_id: booking.id,
      p_check_in: iso(range.from),
      p_check_out: iso(range.to),
    });
    setBusy(false);
    if (err) {
      setError(
        err.code === "23P01"
          ? t("villa.alreadyBooked")
          : err.code === "22023"
            ? t("bookings.changeNotAllowed")
            : t("bookings.changeFailed", { message: err.message }),
      );
      return;
    }
    setOpen(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("bookings.change")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bookings.changeTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {paid ? t("bookings.changeHelpPaid", { count: nights }) : t("bookings.changeHelpUnpaid")}
        </p>
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={disabled}
            excludeDisabled
            defaultMonth={ownIn}
            locale={calendarLocale(i18n.resolvedLanguage ?? "uz")}
          />
        </div>
        {!paid && minNights > 1 && (
          <p className="text-xs text-muted-foreground">{t("villa.minNights", { n: minNights })}</p>
        )}
        {range?.from && range.to && (
          <p className="text-sm font-medium">
            {iso(range.from)} — {iso(range.to)} · {t("villa.nights", { count: newNights })}
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={save} disabled={busy || !nightsOk}>
          {t("bookings.changeSave")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeDatesDialog;
