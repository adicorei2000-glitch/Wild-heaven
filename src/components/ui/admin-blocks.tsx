import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import { addDays, format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { fetchVillas } from "@/lib/villas";
import { calendarLocale } from "@/i18n/calendar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Villa } from "@/data/villa";

interface Block {
  id: number;
  villa_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

// Admin villani ma'lum kunlarga bron uchun yopadi (ta'mir, egasi foydalanadi va hokazo)
function AdminBlocks() {
  const { t, i18n } = useTranslation();
  const [villas, setVillas] = useState<Villa[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [villaId, setVillaId] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadBlocks = useCallback(async () => {
    const { data } = await supabase
      .from("blocked_dates")
      .select("id, villa_id, start_date, end_date, reason")
      .gte("end_date", iso(new Date()))
      .order("start_date");
    setBlocks((data ?? []) as Block[]);
  }, []);

  useEffect(() => {
    fetchVillas()
      .then((v) => {
        setVillas(v);
        if (v[0]) setVillaId(String(v[0].id));
      })
      .catch(() => {});
    loadBlocks();
  }, [loadBlocks]);

  const villaName = (id: number) => villas.find((v) => v.id === id)?.name ?? `#${id}`;

  const submit = async () => {
    if (!villaId || !range?.from) {
      setError(t("admin.blocks.pick"));
      return;
    }
    setError("");
    setBusy(true);
    // Oxirgi yopiladigan kun ham kiradi, bazada esa tugash sanasi keyingi kun
    const last = range.to ?? range.from;
    const { error: err } = await supabase.rpc("admin_block_dates", {
      p_villa_id: Number(villaId),
      p_start: iso(range.from),
      p_end: iso(addDays(last, 1)),
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (err) {
      setError(err.code === "23P01" ? t("admin.blocks.conflict") : t("admin.actionFailed", { message: err.message }));
      return;
    }
    setRange(undefined);
    setReason("");
    loadBlocks();
  };

  const remove = async (id: number) => {
    if (!confirm(t("admin.blocks.confirmRemove"))) return;
    const { error: err } = await supabase.rpc("admin_unblock_dates", { p_id: id });
    if (err) alert(t("admin.actionFailed", { message: err.message }));
    else loadBlocks();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("admin.blocks.help")}</p>

        <Select value={villaId} onValueChange={setVillaId}>
          <SelectTrigger aria-label={t("admin.blocks.villa")}>
            <SelectValue placeholder={t("admin.blocks.villa")} />
          </SelectTrigger>
          <SelectContent>
            {villas.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-fit rounded-xl border">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            locale={calendarLocale(i18n.resolvedLanguage ?? "uz")}
            disabled={{ before: new Date() }}
          />
        </div>

        <Input
          value={reason}
          maxLength={200}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("admin.blocks.reasonPlaceholder")}
          aria-label={t("admin.blocks.reason")}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={submit} disabled={busy}>
          {t("admin.blocks.submit")}
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("admin.blocks.title")}</h2>
        {blocks.length === 0 && <p className="text-muted-foreground">{t("admin.blocks.empty")}</p>}
        {blocks.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{villaName(b.villa_id)}</p>
              <p className="text-sm text-muted-foreground">
                {b.start_date} — {iso(addDays(parseISO(b.end_date), -1))}
                {b.reason && ` · ${b.reason}`}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(b.id)}>
              {t("admin.blocks.remove")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminBlocks;
