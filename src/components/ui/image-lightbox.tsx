import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  images: string[];
  index: number;
  open: boolean;
  alt: string;
  onIndexChange: (i: number) => void;
  onOpenChange: (open: boolean) => void;
}

// To'liq ekranli galereya: strelkalar, klaviatura (←/→/Esc) va telefonda swipe
function ImageLightbox({ images, index, open, alt, onIndexChange, onOpenChange }: Props) {
  const { t } = useTranslation();
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (step: number) => onIndexChange((index + step + count) % count),
    [index, count, onIndexChange],
  );

  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, go]);

  if (count === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 items-center justify-center rounded-none border-0 bg-black/95 p-0 ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>

        <div
          className="flex h-full w-full items-center justify-center"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50 && count > 1) go(dx < 0 ? 1 : -1);
          }}
        >
          <img
            src={images[index]}
            alt={t("villa.imageN", { n: index + 1 })}
            className="max-h-full max-w-full select-none object-contain"
            draggable={false}
          />
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label={t("villa.closeGallery")}
          className="absolute top-4 right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/30"
        >
          <X className="h-5 w-5" />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("villa.prevImage")}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/30"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("villa.nextImage")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white hover:bg-white/30"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {index + 1} / {count}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ImageLightbox;
