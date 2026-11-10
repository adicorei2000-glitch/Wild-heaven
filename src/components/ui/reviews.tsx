import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/useUser";
import {
  deleteReview,
  fetchReviewableBookingId,
  fetchReviews,
  submitReview,
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
    try {
      await submitReview({ villaId, bookingId, rating, comment });
      setRating(0);
      setComment("");
      await load();
      onChanged?.();
    } catch (err) {
      setError(t("reviews.failed", { message: (err as Error).message }));
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("reviews.confirmDelete"))) return;
    try {
      await deleteReview(id);
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
                  onClick={() => handleDelete(r.id)}
                >
                  {t("admin.delete")}
                </button>
              )}
            </div>
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reviews;
