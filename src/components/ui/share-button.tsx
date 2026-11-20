import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  className?: string;
}

// Telefonda tizimning "Ulashish" oynasini ochadi, kompyuterda havolani nusxalaydi
function ShareButton({ title, className }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        /* foydalanuvchi bekor qildi */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("villa.share"), url);
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? t("villa.linkCopied") : t("villa.share")}
      title={copied ? t("villa.linkCopied") : t("villa.share")}
      className={cn(
        "rounded-full bg-white/90 p-2 shadow transition-colors hover:bg-white",
        className,
      )}
    >
      {copied ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <Share2 className="h-5 w-5 text-gray-700" />
      )}
    </button>
  );
}

export default ShareButton;
