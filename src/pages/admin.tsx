import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { fetchVillas } from "@/lib/villas";
import { useAdmin } from "@/lib/useAdmin";
import { notifyBooking } from "@/lib/notify";
import type { Villa } from "@/data/villa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "cancelled";

interface AdminBooking {
  id: number;
  villa_id: number;
  villa_name: string;
  user_email: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: Status;
  created_at: string;
  paid_at: string | null;
}

const BADGE: Record<Status, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function BookingsTab() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.rpc("admin_list_bookings");
    if (error) setError(error.message);
    else setRows(data as AdminBooking[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (b: AdminBooking, status: Status) => {
    if (status === "cancelled" && !confirm(t("admin.confirmCancel"))) return;
    const { error } = await supabase.rpc("admin_set_booking_status", {
      p_booking_id: b.id,
      p_status: status,
    });
    if (error) {
      alert(t("admin.actionFailed", { message: error.message }));
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === b.id ? { ...r, status } : r)));
    notifyBooking(b.id, "status");
  };

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  const label = (s: Status) =>
    t(
      s === "pending"
        ? "bookings.statusPending"
        : s === "confirmed"
          ? "bookings.statusConfirmed"
          : "bookings.statusCancelled",
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | Status)}>
            <SelectTrigger aria-label={t("admin.filter")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.all")}</SelectItem>
              <SelectItem value="pending">{t("bookings.statusPending")}</SelectItem>
              <SelectItem value="confirmed">{t("bookings.statusConfirmed")}</SelectItem>
              <SelectItem value="cancelled">{t("bookings.statusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={load}>
          {t("admin.refresh")}
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && shown.length === 0 && (
        <p className="text-muted-foreground">{t("admin.noBookings")}</p>
      )}

      <div className="space-y-3">
        {shown.map((b) => (
          <div
            key={b.id}
            className="border rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{b.villa_name}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    BADGE[b.status],
                  )}
                >
                  {label(b.status)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {b.user_email ?? "—"} · {b.check_in} — {b.check_out} ·{" "}
                {t("bookings.guestsLine", { count: b.guests })} · ${b.total_price}
                {b.paid_at && <> · {t("pay.paid")}</>}
              </p>
            </div>
            <div className="flex gap-2">
              {b.status === "pending" && (
                <Button size="sm" onClick={() => setStatus(b, "confirmed")}>
                  {t("admin.confirm")}
                </Button>
              )}
              {b.status !== "cancelled" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(b, "cancelled")}>
                  {b.status === "pending" ? t("admin.reject") : t("bookings.cancel")}
                </Button>
              )}
              {b.status === "cancelled" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(b, "pending")}>
                  {t("admin.restore")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface VillaForm {
  name: string;
  location: string;
  country: string;
  price: string;
  max_guests: string;
  rating: string;
  image: string;
  images: string;
  amenities: string;
  description: string;
  lat: string;
  lng: string;
}

const EMPTY: VillaForm = {
  name: "",
  location: "",
  country: "",
  price: "",
  max_guests: "4",
  rating: "4.5",
  image: "",
  images: "",
  amenities: "",
  description: "",
  lat: "",
  lng: "",
};

const splitList = (s: string) =>
  s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);

function VillasTab() {
  const { t } = useTranslation();
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Villa | "new" | null>(null);
  const [form, setForm] = useState<VillaForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchVillas()
      .then(setVillas)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(EMPTY);
    setFormError("");
    setEditing("new");
  };

  const openEdit = (v: Villa) => {
    setForm({
      name: v.name,
      location: v.location,
      country: v.country,
      price: String(v.price),
      max_guests: String(v.maxGuests),
      rating: String(v.rating),
      image: v.image,
      images: v.images.join("\n"),
      amenities: v.amenities.join(", "),
      description: v.description,
      lat: v.lat === null ? "" : String(v.lat),
      lng: v.lng === null ? "" : String(v.lng),
    });
    setFormError("");
    setEditing(v);
  };

  const set = (k: keyof VillaForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Rasmni Supabase Storage'ga yuklaydi va ochiq URL qaytaradi
  const uploadImage = async (file: File): Promise<string> => {
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext || "jpg"}`;
    const { error } = await supabase.storage
      .from("villa-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from("villa-images").getPublicUrl(path).data.publicUrl;
  };

  const handleUpload =
    (target: "image" | "images") => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (files.length === 0) return;
      setFormError("");
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const f of target === "image" ? files.slice(0, 1) : files) {
          urls.push(await uploadImage(f));
        }
        setForm((f) =>
          target === "image"
            ? { ...f, image: urls[0] }
            : { ...f, images: [f.images.trim(), ...urls].filter(Boolean).join("\n") },
        );
      } catch (err) {
        setFormError(t("admin.uploadFailed", { message: (err as Error).message }));
      }
      setUploading(false);
    };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const price = Number(form.price);
    const maxGuests = Number(form.max_guests);
    const rating = Number(form.rating);
    const bothOrNone = (form.lat.trim() === "") === (form.lng.trim() === "");
    if (!bothOrNone || !(price > 0) || !(maxGuests >= 1) || !(rating >= 0 && rating <= 5)) {
      setFormError(t("admin.invalidNumbers"));
      return;
    }
    const payload = {
      name: form.name.trim(),
      location: form.location.trim(),
      country: form.country.trim(),
      price,
      max_guests: maxGuests,
      rating,
      image: form.image.trim(),
      images: splitList(form.images),
      amenities: splitList(form.amenities),
      description: form.description.trim(),
      lat: form.lat.trim() === "" ? null : Number(form.lat),
      lng: form.lng.trim() === "" ? null : Number(form.lng),
    };
    setSaving(true);
    const { error } =
      editing === "new"
        ? await supabase.from("villas").insert(payload)
        : await supabase.from("villas").update(payload).eq("id", (editing as Villa).id);
    setSaving(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (v: Villa) => {
    if (!confirm(t("admin.confirmDelete", { name: v.name }))) return;
    const { error } = await supabase.from("villas").delete().eq("id", v.id);
    if (error) {
      alert(t("admin.actionFailed", { message: error.message }));
      return;
    }
    load();
  };

  const field = (k: keyof VillaForm, label: string, props: React.ComponentProps<"input"> = {}) => (
    <div className="space-y-1">
      <label htmlFor={`f-${k}`} className="text-sm font-medium">
        {label}
      </label>
      <Input id={`f-${k}`} value={form[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Button onClick={openNew}>{t("admin.addVilla")}</Button>

      {loading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        {villas.map((v) => (
          <div
            key={v.id}
            className="border rounded-xl p-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img src={v.image} alt="" className="h-14 w-20 rounded-md object-cover shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{v.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {v.location} · ${v.price} · {t("bookings.guestsLine", { count: v.maxGuests })}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => openEdit(v)}>
                {t("admin.edit")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => remove(v)}>
                {t("admin.delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? t("admin.addVilla") : t("admin.editVilla")}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={save}>
            {field("name", t("admin.name"), { required: true })}
            {field("location", t("admin.location"), { required: true })}
            {field("country", t("admin.country"), { required: true })}
            <div className="grid grid-cols-3 gap-2">
              {field("price", t("admin.price"), { type: "number", min: 1, step: "any", required: true })}
              {field("max_guests", t("admin.maxGuests"), { type: "number", min: 1, required: true })}
              {field("rating", t("admin.rating"), { type: "number", min: 0, max: 5, step: "0.1", required: true })}
            </div>
            {field("image", t("admin.image"), { type: "url", required: true })}
            <div className="space-y-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={handleUpload("image")}
                aria-label={t("admin.upload")}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {uploading ? t("admin.uploading") : t("admin.uploadHint")}
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="f-images" className="text-sm font-medium">
                {t("admin.images")}
              </label>
              <textarea
                id="f-images"
                rows={3}
                value={form.images}
                onChange={set("images")}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              />
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={handleUpload("images")}
                aria-label={t("admin.upload")}
                className="text-sm"
              />
            </div>
            {field("amenities", t("admin.amenities"))}
            <div className="grid grid-cols-2 gap-2">
              {field("lat", t("admin.lat"), { type: "number", step: "any", min: -90, max: 90 })}
              {field("lng", t("admin.lng"), { type: "number", step: "any", min: -180, max: 180 })}
            </div>
            <p className="text-xs text-muted-foreground">{t("admin.coordsHint")}</p>
            <div className="space-y-1">
              <label htmlFor="f-description" className="text-sm font-medium">
                {t("admin.description")}
              </label>
              <textarea
                id="f-description"
                rows={4}
                value={form.description}
                onChange={set("description")}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t("admin.close")}
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? t("auth.saving") : t("admin.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Admin() {
  const { t } = useTranslation();
  const { isAdmin, loading, user } = useAdmin();
  const [tab, setTab] = useState<"bookings" | "villas">("bookings");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("admin.noAccess")}</h1>
        <Link to={user ? "/" : "/login"}>
          <Button>{user ? t("villa.backHome") : t("nav.login")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t("admin.title")}</h1>
      <div className="flex gap-2 mb-6">
        <Button variant={tab === "bookings" ? "default" : "outline"} onClick={() => setTab("bookings")}>
          {t("admin.bookings")}
        </Button>
        <Button variant={tab === "villas" ? "default" : "outline"} onClick={() => setTab("villas")}>
          {t("admin.villas")}
        </Button>
      </div>
      {tab === "bookings" ? <BookingsTab /> : <VillasTab />}
    </div>
  );
}

export default Admin;
