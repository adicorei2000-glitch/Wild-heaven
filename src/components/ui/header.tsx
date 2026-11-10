import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { useAdmin } from "@/lib/useAdmin";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Header() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("nav.profile");

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-bold">
          Wild Haven
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            {t("nav.home")}
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary">
            {t("nav.about")}
          </Link>

          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{displayName}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/my-bookings">{t("nav.myBookings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites">{t("nav.favorites")}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">{t("nav.admin")}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button>{t("nav.login")}</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
