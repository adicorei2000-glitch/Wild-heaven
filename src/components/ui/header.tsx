import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/ui/language-switcher";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useAdmin } from "@/lib/useAdmin";
import { Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

  const userItems = (
    <>
      <DropdownMenuItem asChild>
        <Link to="/profile">{t("nav.profile")}</Link>
      </DropdownMenuItem>
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
      <DropdownMenuItem onClick={handleLogout}>{t("nav.logout")}</DropdownMenuItem>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3 md:py-4">
        <Link to="/" className="text-xl font-bold md:text-2xl">
          Wild Haven
        </Link>

        {/* Kompyuter */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            {t("nav.home")}
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary">
            {t("nav.about")}
          </Link>

          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{displayName}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">{userItems}</DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button>{t("nav.login")}</Button>
            </Link>
          )}
        </nav>

        {/* Telefon */}
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("nav.menu")}>
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem asChild>
                <Link to="/">{t("nav.home")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/about">{t("nav.about")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                  {userItems}
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;
