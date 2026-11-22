import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchMessages, sendMessage, type BookingMessage } from "@/lib/messages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Bron bo'yicha mehmon ↔ ega yozishmasi. Ochiq turganda ~20 soniyada yangilanadi.
function BookingChat({ bookingId, asAdmin = false }: { bookingId: number; asAdmin?: boolean }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setMessages(await fetchMessages(bookingId));
    } catch {
      /* keyingi urinishda */
    }
  }, [bookingId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setNote("");
    const res = await sendMessage(bookingId, text);
    setSending(false);
    if (res === null) {
      setText("");
      load();
    } else {
      setNote(res === "rate" ? t("messages.rateLimit") : t("messages.failed"));
    }
  };

  return (
    <div className="w-full border-t pt-4 space-y-3">
      <h3 className="text-sm font-semibold">{t("messages.title")}</h3>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">{t("messages.empty")}</p>}
        {messages.map((m) => {
          const mine = m.from_admin === asAdmin;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                  mine ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.body}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {mine ? t("messages.you") : m.from_admin ? t("messages.host") : t("messages.guest")} ·{" "}
                {new Date(m.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder={t("messages.placeholder")}
          aria-label={t("messages.placeholder")}
          className="flex-1 min-w-0 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>
          {t("messages.send")}
        </Button>
      </form>
      {note && <p className="text-xs text-red-500">{note}</p>}
    </div>
  );
}

export default BookingChat;
