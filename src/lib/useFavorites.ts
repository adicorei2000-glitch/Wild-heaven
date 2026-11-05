import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export type ToggleResult = "login" | "ok" | "error";

// Foydalanuvchining sevimli villalari (RLS tufayli faqat o'zinikilar keladi)
export function useFavorites() {
  const { user, loading: userLoading } = useUser();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from("favorites")
      .select("villa_id")
      .then(({ data }) => {
        if (cancelled) return;
        setIds(
          new Set((data ?? []).map((r: { villa_id: number }) => r.villa_id)),
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, userLoading]);

  const toggle = useCallback(
    async (villaId: number): Promise<ToggleResult> => {
      if (!user) return "login";

      const wasFavorite = ids.has(villaId);

      // Optimistik yangilash: ekran darhol o'zgaradi, xato bo'lsa qaytariladi
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(villaId);
        else next.add(villaId);
        return next;
      });

      const { error } = wasFavorite
        ? await supabase
            .from("favorites")
            .delete()
            .eq("villa_id", villaId)
            .eq("user_id", user.id)
        : await supabase.from("favorites").insert({ villa_id: villaId });

      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(villaId);
          else next.delete(villaId);
          return next;
        });
        return "error";
      }

      return "ok";
    },
    [user, ids],
  );

  return { user, ids, loading: loading || userLoading, toggle };
}
