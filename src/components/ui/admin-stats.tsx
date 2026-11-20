import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  revenue: number;
  revenue_30d: number;
  refunded: number;
  nights: number;
  top_villas: { name: string; bookings: number; revenue: number }[];
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

const money = (n: number) => `$${Number(n).toLocaleString()}`;

function AdminStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.rpc("admin_stats").then(({ data, error }) => {
      if (error) setError(error.message);
      else setStats(data as Stats);
    });
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!stats) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label={t("admin.stats.revenue")} value={money(stats.revenue)} />
        <Card label={t("admin.stats.revenue30")} value={money(stats.revenue_30d)} />
        <Card label={t("admin.stats.refunded")} value={money(stats.refunded)} />
        <Card label={t("admin.stats.nights")} value={stats.nights} />
        <Card label={t("admin.stats.total")} value={stats.total} />
        <Card label={t("bookings.statusPending")} value={stats.pending} />
        <Card label={t("bookings.statusConfirmed")} value={stats.confirmed} />
        <Card label={t("bookings.statusCancelled")} value={stats.cancelled} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">{t("admin.stats.top")}</h2>
        {stats.top_villas.length === 0 ? (
          <p className="text-muted-foreground">{t("admin.noBookings")}</p>
        ) : (
          <ol className="space-y-2">
            {stats.top_villas.map((v, i) => (
              <li key={v.name} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <span className="min-w-0 truncate">
                  {i + 1}. <span className="font-medium">{v.name}</span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {t("admin.stats.bookingsCount", { count: v.bookings })} · {money(v.revenue)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default AdminStats;
