import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  className?: string;
}

function FavoriteButton({ active, onToggle, className }: FavoriteButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={active ? t("favorite.remove") : t("favorite.add")}
      aria-pressed={active}
      onClick={(e) => {
        // Kartochka havolasi ichida bo'lsa ham sahifaga o'tib ketmasin
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "rounded-full bg-white/90 p-2 shadow transition-colors hover:bg-white",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          active ? "fill-red-500 text-red-500" : "text-gray-700",
        )}
      />
    </button>
  );
}

export default FavoriteButton;
