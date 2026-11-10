import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

// Joriy foydalanuvchi admin ekanini bazadan so'raydi (is_admin()).
// Bu faqat tugma/sahifani ko'rsatish uchun; haqiqiy himoya bazadagi RLS va RPC'larda.
export function useAdmin() {
  const { user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (cancelled) return;
      setIsAdmin(!error && data === true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, userLoading]);

  return { isAdmin, loading: loading || userLoading, user };
}
