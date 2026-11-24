import { useCallback, useEffect, useMemo, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/useUser";
import ImageLightbox from "@/components/ui/image-lightbox";
import {
  deleteReview,
  fetchReviewableBookingId,
  fetchReviews,
  MAX_REVIEW_PHOTOS,
  removeReviewImages,
  submitReview,
  uploadReviewImages,
  type Review,
} from "@/lib/reviews";
import { cn } from "@/lib/utils";

function Stars({ value }: { value: number }) {
  return (
    <span className="flex" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

interface Props {
  villaId: number;
  // Sharh qo'shilgan/o'chirilganda villa reytingi yangilansin
  onChanged?: () => void;
}

function Reviews({ villaId, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list).filter((f) => f.type.startsWith("image/"))];
    if (next.length > MAX_REVIEW_PHOTOS) setError(t("reviews.tooManyPhotos", { count: MAX_REVIEW_PHOTOS }));
    else setError("");
    setFiles(next.slice(0, MAX_REVIEW_PHOTOS));
  };

  const load = useCallback(async () => {
    try {
      setReviews(await fetchReviews(villaId));
    } catch {
      setReviews([]);
    }
    setBookingId(user ? await fetchReviewableBookingId(villaId, user.id) : null);
    setLoading(false);
  }, [villaId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || rating < 1) {
      setError(t("reviews.pickRating"));
      return;
    }
    setError("");
    setSubmitting(true);
    let uploaded: string[] = [];
    try {
      uploaded = user ? await uploadReviewImages(user.id, files) : [];
      await submitReview({ villaId, bookingId, rating, comment, images: uploaded });
      setRating(0);
      setComment("");
      setFiles([]);
      await load();
      onChanged?.();
    } catch (err) {
      await removeReviewImages(uploaded);
      setError(t("reviews.failed", { message: (err as Error).message }));
    }
    setSubmitting(false);
  };

  const handleDelete = async (review: Review) => {
    if (!confirm(t("reviews.confirmDelete"))) return;
    try {
      await deleteReview(review.id, review.images);
      await load();
      onChanged?.();
    } catch (err) {
      alert(t("reviews.failed", { message: (err as Error).message }));
    }
  };

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.resolvedLanguage ?? "uz");

  return (
    <div className="border-t pt-6 space-y-4">
      <h2 className="text-xl font-semibold">
        {t("reviews.title")}
        {reviews.length > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({reviews.length})
          </span>
        )}
      </h2>

      {bookingId && (
        <form onSubmit={handleSubmit} className="rounded-xl border p-4 space-y-3">
          <p className="font-medium">{t("reviews.writeTitle")}</p>
          <div className="flex gap-1" role="radiogroup" aria-label={t("reviews.rating")}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n}`}
                onClick={() => setRating(n)}
              >
                <Star
                  className={cn(
                    "h-7 w-7",
                    n <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={t("reviews.commentPlaceholder")}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={t("reviews.removePhoto")}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {files.length < MAX_REVIEW_PHOTOS && (
              <label className="flex h-16 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted">
                <ImagePlus className="h-4 w-4" />
                {t("reviews.addPhotos", { count: MAX_REVIEW_PHOTOS })}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    pickFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? t("villa.btnSubmitting") : t("reviews.submit")}
          </Button>
        </form>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("reviews.empty")}</p>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Stars value={r.rating} />
              <span className="font-medium">{r.author || t("reviews.guest")}</span>
              <span className="text-muted-foreground">{date(r.created_at)}</span>
              {r.mine && (
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground underline"
                  onClick={() => handleDelete(r)}
                >
                  {t("admin.delete")}
                </button>
              )}
            </div>
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            {r.images?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {r.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setViewer({ images: r.images, index: i })}
                    aria-label={t("villa.openGallery")}
                    className="h-20 w-20 overflow-hidden rounded-lg border"
                  >
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {viewer && (
        <ImageLightbox
          images={viewer.images}
          index={viewer.index}
          open
          alt={t("reviews.title")}
          onIndexChange={(index) => setViewer({ ...viewer, index })}
          onOpenChange={(open) => !open && setViewer(null)}
        />
      )}
    </div>
  );
}

export default Reviews;
