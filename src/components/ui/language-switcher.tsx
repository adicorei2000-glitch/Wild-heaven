import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/i18n";

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current =
    LANGUAGES.find((l) => l.code === i18n.resolvedLanguage)?.code ?? "uz";

  return (
    <Select value={current} onValueChange={(code) => i18n.changeLanguage(code)}>
      <SelectTrigger aria-label={t("lang.label")} className={compact ? "w-auto gap-1 px-2" : "w-[140px] gap-2"}>
        <Globe className="h-4 w-4 shrink-0" />
        <SelectValue className={compact ? "sr-only" : undefined} />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LanguageSwitcher;
