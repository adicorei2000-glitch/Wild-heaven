import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import heroImage from "@/assets/hero2.jpg";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      // Email ro'yxatdan o'tgan-o'tmaganini oshkor qilmaymiz
      setInfo(
        "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasi yuborildi. Pochtangizni tekshiring.",
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Parolni tiklash</h1>
            <p className="text-muted-foreground mt-2">
              Emailingizni kiriting, tiklash havolasini yuboramiz
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@misol.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Yuborilmoqda..." : "Havola yuborish"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-medium underline">
              Kirish sahifasiga qaytish
            </Link>
          </p>
        </div>
      </div>

      <div
        className="hidden lg:block bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
    </div>
  );
}

export default ForgotPassword;
