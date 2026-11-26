import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { addDays, addMonths, endOfMonth, format, isSameDay, startOfMonth, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { fetchVillas } from "@/lib/villas";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Villa } from "@/data/villa";

interface CalBooking {
  id: number;
  user_email: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: "pending" | "confirmed";
  paid_at: string | null;
}

interface CalBlock {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

// Admin uchun oylik kalendar: bitta villaning bronlari va yopilgan kunlari bir ko'rinishda
function AdminCalendar() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? "uz";
  const [villas, setVillas] = useState<Villa[]>([]);
  const [villaId, setVillaId] = useState("");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [blocks, setBlocks] = useState<CalBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<Date | null>(null);

  useEffect(() => {
    fetchVillas()
      .then((v) => {
        setVillas(v);
        if (v[0]) setVillaId(String(v[0].id));
      })
      .catch(() => setError(t("admin.cal.loadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!villaId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setPicked(null);
    Promise.all([
      supabase
        .from("bookings")
        .select("id, user_email, check_in, check_out, guests, total_price, status, paid_at")
        .eq("villa_id", Number(villaId))
        .neq("status", "cancelled")
        .order("check_in"),
      supabase
        .from("blocked_dates")
        .select("id, start_date, end_date, reason")
        .eq("villa_id", Number(villaId))
        .order("start_date"),
    ]).then(([b, bl]) => {
      if (cancelled) return;
      if (b.error || bl.error) setError(t("admin.cal.loadFailed"));
      setBookings((b.data ?? []) as CalBooking[]);
      setBlocks((bl.data ?? []) as CalBlock[]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villaId]);

  // Oy kataklari: haftaning birinchi kunidan (dushanba), 6 hafta
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(lang, { weekday: "short" }).format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)),
      ),
    [lang],
  );

  // Tun [check_in, check_out) oralig'ida band hisoblanadi
  const bookingOn = (d: Date) => {
    const s = iso(d);
    return bookings.find((b) => b.check_in <= s && s < b.check_out);
  };
  const blockOn = (d: Date) => {
    const s = iso(d);
    return blocks.find((b) => b.start_date <= s && s < b.end_date);
  };

  const pickedBooking = picked ? bookingOn(picked) : undefined;
  const pickedBlock = picked ? blockOn(picked) : undefined;
  const monthLabel = new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(month);
  const today = new Date();

  const cellClass = (d: Date) => {
    const b = bookingOn(d);
    const bl = blockOn(d);
    const base = "relative h-14 sm:h-20 rounded-md border p-1 text-left align-top text-xs transition-colors";
    const outside = d < startOfMonth(month) || d > endOfMonth(month) ? " opacity-40" : "";
    const sel = picked && isSameDay(picked, d) ? " ring-2 ring-primary" : "";
    if (b) {
      return `${base}${outside}${sel} ${b.status === "confirmed" ? "bg-green-100 border-green-300 text-green-900" : "bg-yellow-100 border-yellow-300 text-yellow-900"}`;
    }
    if (bl) return `${base}${outside}${sel} bg-muted border-muted-foreground/30 text-muted-foreground`;
    return `${base}${outside}${sel} hover:bg-accent`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-60">
          <Select value={villaId} onValueChange={setVillaId}>
            <SelectTrigger aria-label={t("admin.cal.villa")}>
              <SelectValue placeholder={t("admin.cal.villa")} />
            </SelectTrigger>
            <SelectContent>
              {villas.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label={t("admin.cal.prev")}>
          ‹
        </Button>
        <span className="min-w-36 text-center font-medium capitalize">{monthLabel}</span>
        <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label={t("admin.cal.next")}>
          ›
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
          {t("admin.cal.today")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <i className="inline-block size-3 rounded bg-green-200 border border-green-300" /> {t("admin.cal.confirmed")}
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block size-3 rounded bg-yellow-200 border border-yellow-300" /> {t("admin.cal.pending")}
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block size-3 rounded bg-muted border border-muted-foreground/30" /> {t("admin.cal.blocked")}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className={loading ? "opacity-60" : ""}>
        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-xs font-medium text-muted-foreground">
          {weekdays.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const b = bookingOn(d);
            const isStart = b && b.check_in === iso(d);
            return (
              <button
                type="button"
                key={iso(d)}
                className={cellClass(d)}
                onClick={() => setPicked(d)}
                aria-label={iso(d)}
              >
                <span className={isSameDay(d, today) ? "font-bold underline" : ""}>{format(d, "d")}</span>
                {isStart && (
                  <span className="mt-0.5 hidden sm:block truncate leading-tight">{b.user_email?.split("@")[0] ?? `#${b.id}`}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {picked && (
        <div className="rounded-lg border p-4 space-y-1 text-sm">
          <p className="font-semibold">{format(picked, "dd.MM.yyyy")}</p>
          {pickedBooking ? (
            <>
              <p>
                {t("admin.cal.booking")} #{pickedBooking.id} · {t(`admin.cal.${pickedBooking.status}`)}
                {pickedBooking.paid_at ? ` · ${t("pay.paid")}` : ""}
              </p>
              <p>{pickedBooking.user_email ?? "—"}</p>
              <p>
                {pickedBooking.check_in} → {pickedBooking.check_out} · {t("admin.cal.guests", { n: pickedBooking.guests })} · $
                {pickedBooking.total_price}
              </p>
            </>
          ) : pickedBlock ? (
            <p>
              {t("admin.cal.blocked")}
              {pickedBlock.reason ? `: ${pickedBlock.reason}` : ""} ({pickedBlock.start_date} → {pickedBlock.end_date})
            </p>
          ) : (
            <p className="text-muted-foreground">{t("admin.cal.free")}</p>
          )}
        </div>
      )}
      {!villas.length && !error && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
    </div>
  );
}

export default AdminCalendar;
