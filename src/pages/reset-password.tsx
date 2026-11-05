import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import heroImage from "@/assets/hero2.jpg";

function ResetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Emaildagi havola orqali kelgan foydalanuvchida vaqtinchalik sessiya bo'ladi
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setInfo("Parol yangilandi. Bosh sahifaga o'tilmoqda...");
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <div className="min-h-[calc(100vh-73px)] grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Yangi parol</h1>
            <p className="text-muted-foreground mt-2">
              Hisobingiz uchun yangi parol o'rnating
            </p>
          </div>

          {checking && <p className="text-muted-foreground">Tekshirilmoqda...</p>}

          {!checking && !ready && (
            <div className="space-y-3">
              <p className="text-sm text-red-500">
                Havola yaroqsiz yoki muddati o'tgan.
              </p>
              <Link
                to="/forgot-password"
                className="text-primary font-medium underline"
              >
                Yangi havola so'rash
              </Link>
            </div>
          )}

          {!checking && ready && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Yangi parol
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Parolni tasdiqlang
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {info && <p className="text-sm text-green-600">{info}</p>}

              <Button type="submit" className="w-full" disabled={loading || !!info}>
                {loading ? "Saqlanmoqda..." : "Parolni saqlash"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div
        className="hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
    </div>
  );
}

export default ResetPassword;
