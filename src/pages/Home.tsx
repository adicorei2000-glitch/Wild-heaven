import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
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
import type { Villa } from "@/data/villa";

type Sort = "default" | "price-asc" | "price-desc" | "rating";

function Home() {
  const navigate = useNavigate();
  const { ids: favoriteIds, toggle } = useFavorites();

  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [guests, setGuests] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
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

  const countries = useMemo(
    () =>
      Array.from(new Set(villas.map((v) => v.country).filter(Boolean))).sort(),
    [villas],
  );

  const filtersActive =
    query.trim() !== "" ||
    country !== "all" ||
    guests !== "all" ||
    maxPrice !== "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const max = Number(maxPrice);
    const minGuests = guests === "all" ? 0 : Number(guests);

    const list = villas.filter(
      (v) =>
        (!q ||
          v.name.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q)) &&
        (country === "all" || v.country === country) &&
        v.maxGuests >= minGuests &&
        (!(max > 0) || v.price <= max),
    );

    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [villas, query, country, guests, maxPrice, sort]);

  const clearFilters = () => {
    setQuery("");
    setCountry("all");
    setGuests("all");
    setMaxPrice("");
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
            O'z jannatingizni toping
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Dunyoning eng go'zal joylarida ajoyib villalarni bron qiling
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
              Joylarni ko'rish
            </Button>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20"
              >
                Ko'proq bilish
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="villalar" className="container mx-auto px-4 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Mashhur villalar</h2>
            {!loading && !error && (
              <p className="text-sm text-muted-foreground mt-1">
                {filtered.length} ta villa topildi
              </p>
            )}
          </div>

          <div className="w-full sm:w-56">
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Saralash">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Tavsiya etilgan</SelectItem>
                <SelectItem value="price-asc">Narx: arzondan qimmatga</SelectItem>
                <SelectItem value="price-desc">Narx: qimmatdan arzonga</SelectItem>
                <SelectItem value="rating">Reyting bo'yicha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Qidiruv va filtrlar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Qidiruv"
              placeholder="Nomi yoki joylashuvi bo'yicha qidirish"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger aria-label="Davlat">
              <SelectValue placeholder="Davlat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha davlatlar</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger aria-label="Mehmonlar soni">
              <SelectValue placeholder="Mehmonlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Istalgan mehmon soni</SelectItem>
              {[2, 4, 6, 8].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+ mehmon
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            aria-label="Eng yuqori narx"
            type="number"
            min={0}
            placeholder="Maks. narx ($)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
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
            <p className="font-medium">Villalarni yuklab bo'lmadi</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              Qayta urinish
            </Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border p-8 text-center space-y-3">
            <p className="font-medium">Hech narsa topilmadi</p>
            <p className="text-sm text-muted-foreground">
              Filtrlarni o'zgartirib ko'ring.
            </p>
            {filtersActive && (
              <Button variant="outline" onClick={clearFilters}>
                Filtrlarni tozalash
              </Button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {filtersActive && (
              <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Filtrlarni tozalash
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
