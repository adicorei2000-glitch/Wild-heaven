import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { calendarLocale } from "@/i18n/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import heroImage from "@/assets/hero2.jpg";
import VillaCard from "@/components/ui/Villacards";
import { fetchVillas } from "@/lib/villas";
import { useFavorites } from "@/lib/useFavorites";
import { villaText, countryName } from "@/i18n/villa";
import type { Villa } from "@/data/villa";

type Sort = "default" | "price-asc" | "price-desc" | "rating";

function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { ids: favoriteIds, toggle } = useFavorites();

  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [guests, setGuests] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [availableIds, setAvailableIds] = useState<Set<number> | null>(null);
  const [sort, setSort] = useState<Sort>("default");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchVillas()
      .then((data) => {
        if (!cancelled) setVillas(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Tanlangan sanalarda bo'sh villalar (bazadagi get_available_villa_ids)
  useEffect(() => {
    if (!range?.from || !range?.to) {
      setAvailableIds(null);
      return;
    }
    let cancelled = false;
    supabase
      .rpc("get_available_villa_ids", {
        p_check_in: format(range.from, "yyyy-MM-dd"),
        p_check_out: format(range.to, "yyyy-MM-dd"),
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        setAvailableIds(error ? null : new Set((data ?? []) as number[]));
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const countries = useMemo(
    () =>
      Array.from(new Set(villas.map((v) => v.country).filter(Boolean))).sort(),
    [villas],
  );

  const filtersActive =
    query.trim() !== "" ||
    country !== "all" ||
    guests !== "all" ||
    maxPrice !== "" ||
    availableIds !== null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const text = (v: Villa) => villaText(t, v);
    const max = Number(maxPrice);
    const minGuests = guests === "all" ? 0 : Number(guests);

    const list = villas.filter(
      (v) =>
        (!q ||
          [v.name, v.location, text(v).name, text(v).location].some((s) =>
            s.toLowerCase().includes(q),
          )) &&
        (country === "all" || v.country === country) &&
        (!availableIds || availableIds.has(v.id)) &&
        v.maxGuests >= minGuests &&
        (!(max > 0) || v.price <= max),
    );

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [villas, query, country, guests, maxPrice, sort, availableIds, t]);

  const clearFilters = () => {
    setQuery("");
    setCountry("all");
    setGuests("all");
    setMaxPrice("");
    setRange(undefined);
  };

  const handleToggleFavorite = async (villaId: number) => {
    const result = await toggle(villaId);
    if (result === "login") navigate("/login");
  };

  return (
    <>
      <section
        className="relative h-[calc(100vh-73px)] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 text-center text-white px-4 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            {t("home.heroTitle")}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            {t("home.heroSubtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("villalar")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {t("home.explore")}
            </Button>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20"
              >
                {t("home.learnMore")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="villalar" className="container mx-auto px-4 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">{t("home.popular")}</h2>
            {!loading && !error && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("home.found", { count: filtered.length })}
              </p>
            )}
          </div>

          <div className="w-full sm:w-56">
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label={t("home.sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t("home.sortDefault")}</SelectItem>
                <SelectItem value="price-asc">{t("home.sortPriceAsc")}</SelectItem>
                <SelectItem value="price-desc">{t("home.sortPriceDesc")}</SelectItem>
                <SelectItem value="rating">{t("home.sortRating")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Qidiruv va filtrlar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 mb-8">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t("home.search")}
              placeholder={t("home.searchPlaceholder")}
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger aria-label={t("home.country")}>
              <SelectValue placeholder={t("home.country")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("home.allCountries")}</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {countryName(t, c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger aria-label={t("home.guests")}>
              <SelectValue placeholder={t("home.guestsShort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("home.anyGuests")}</SelectItem>
              {[2, 4, 6, 8].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {t("home.guestsPlus", { count: n })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label={t("home.maxPrice")}
            type="number"
            min={0}
            placeholder={t("home.maxPricePlaceholder")}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                aria-label={t("home.dates")}
                className="w-full justify-start font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {range?.from
                    ? range.to
                      ? `${format(range.from, "dd.MM")} – ${format(range.to, "dd.MM")}`
                      : format(range.from, "dd.MM.yyyy")
                    : t("home.dates")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                locale={calendarLocale(i18n.resolvedLanguage ?? "uz")}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-3">
                <div className="aspect-[4/3] rounded-xl bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border p-8 text-center space-y-3">
            <p className="font-medium">{t("home.loadError")}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              {t("home.retry")}
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border p-8 text-center space-y-3">
            <p className="font-medium">{t("home.nothingFound")}</p>
            <p className="text-sm text-muted-foreground">
              {t("home.changeFilters")}
            </p>
            {filtersActive && (
              <Button variant="outline" onClick={clearFilters}>
                {t("home.clearFilters")}
              </Button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {filtersActive && (
              <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t("home.clearFilters")}
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map((villa) => (
                <VillaCard
                  key={villa.id}
                  villa={villa}
                  favorite={favoriteIds.has(villa.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default Home;
