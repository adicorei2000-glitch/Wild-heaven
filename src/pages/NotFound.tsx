import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold">{t("errors.notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errors.notFoundText")}</p>
      <Link to="/">
        <Button>{t("villa.backHome")}</Button>
      </Link>
    </div>
  );
}

export default NotFound;
