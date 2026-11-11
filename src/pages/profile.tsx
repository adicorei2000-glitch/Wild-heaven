import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Profile() {
  const { t } = useTranslation();
  const { user, loading } = useUser();
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName((user?.user_metadata?.full_name as string | undefined) ?? "");
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("profile.loginPrompt")}</h1>
        <Link to="/login">
          <Button>{t("nav.login")}</Button>
        </Link>
      </div>
    );
  }

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMsg(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setBusy(false);
    setNameMsg(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: t("profile.saved") },
    );
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (password !== confirm) {
      setPwMsg({ ok: false, text: t("auth.passwordMismatch") });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setPwMsg({ ok: false, text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setPwMsg({ ok: true, text: t("profile.passwordSaved") });
  };

  const msg = (m: { ok: boolean; text: string } | null) =>
    m && (
      <p className={m.ok ? "text-sm text-green-600" : "text-sm text-red-500"}>{m.text}</p>
    );

  return (
    <div className="container mx-auto px-4 py-10 max-w-md space-y-10">
      <h1 className="text-3xl font-bold">{t("profile.title")}</h1>

      <form className="space-y-4" onSubmit={saveName}>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("auth.email")}</label>
          <Input value={user.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            {t("auth.fullName")}
          </label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {msg(nameMsg)}
        <Button type="submit" disabled={busy}>
          {t("admin.save")}
        </Button>
      </form>

      <form className="space-y-4 border-t pt-8" onSubmit={savePassword}>
        <h2 className="text-xl font-semibold">{t("profile.changePassword")}</h2>
        <div className="space-y-2">
          <label htmlFor="pw" className="text-sm font-medium">
            {t("auth.newPassword")}
          </label>
          <Input
            id="pw"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pw2" className="text-sm font-medium">
            {t("auth.confirmPassword")}
          </label>
          <Input
            id="pw2"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {msg(pwMsg)}
        <Button type="submit" disabled={busy}>
          {t("auth.savePassword")}
        </Button>
      </form>
    </div>
  );
}

export default Profile;
