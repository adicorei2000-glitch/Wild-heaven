import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import VillaCard from "@/components/ui/Villacards";
import { fetchVillas } from "@/lib/villas";
import { useFavorites } from "@/lib/useFavorites";
import type { Villa } from "@/data/villa";

function Favorites() {
  const { t } = useTranslation();
  const { user, ids, loading: favoritesLoading, toggle } = useFavorites();
  const [villas, setVillas] = useState<Villa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

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
  }, []);

  if (loading || favoritesLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">
          {t("favorites.loginPrompt")}
        </h1>
        <Link to="/login">
          <Button>{t("nav.login")}</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-2">
        <h1 className="text-2xl font-bold">{t("favorites.loadFailed")}</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const favorites = villas.filter((v) => ids.has(v.id));

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{t("favorites.title")}</h1>

      {favorites.length === 0 ? (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {t("favorites.empty")}
          </p>
          <Link to="/">
            <Button variant="outline">{t("favorites.browse")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((villa) => (
            <VillaCard
              key={villa.id}
              villa={villa}
              favorite
              onToggleFavorite={(id) => {
                toggle(id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
