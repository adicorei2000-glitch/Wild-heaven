import type { TFunction } from "i18next";
import { CONTACT_EMAIL } from "@/lib/site";

export interface ReceiptData {
  id: number;
  villaName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  paidAt: string | null;
  email: string | null;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const nights = (a: string, b: string) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

// Chek sahifasini yangi oynada ochib, chop etish (PDF sifatida saqlash) dialogini ko'rsatadi.
// Brauzer shriftlari ishlatiladi, shuning uchun barcha tillar (uz/en/ru/ko) to'g'ri chiqadi.
export function openReceipt(t: TFunction, r: ReceiptData) {
  const n = nights(r.checkIn, r.checkOut);
  const row = (k: string, v: string) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t("receipt.title"))} #${r.id}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,"Noto Sans KR","Malgun Gothic",sans-serif;color:#111;max-width:620px;margin:40px auto;padding:0 20px}
h1{font-size:22px;margin:0}.brand{color:#2f7d4f;font-weight:700;font-size:18px;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:24px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px}
th{color:#666;font-weight:500;width:40%}.total td,.total th{font-size:17px;font-weight:700;border-bottom:2px solid #111}
.foot{margin-top:28px;color:#888;font-size:12px}
button{margin-top:24px;padding:8px 16px;font-size:14px;cursor:pointer}
@media print{button{display:none}body{margin:0}}
</style></head><body>
<div class="brand">Wild Haven</div>
<h1>${esc(t("receipt.title"))} #${r.id}</h1>
<div class="sub">${esc(t("receipt.issued"))}: ${esc(new Date().toISOString().slice(0, 10))}</div>
<table>
${row(t("receipt.villa"), r.villaName)}
${row(t("receipt.dates"), `${r.checkIn} — ${r.checkOut} (${t("receipt.nights", { count: n })})`)}
${row(t("receipt.guests"), String(r.guests))}
${r.email ? row(t("receipt.guest"), r.email) : ""}
${row(t("receipt.status"), r.paidAt ? `${t("receipt.paid")} (${r.paidAt.slice(0, 10)})` : t("receipt.confirmedUnpaid"))}
<tr class="total"><th>${esc(t("receipt.total"))}</th><td>$${r.total}</td></tr>
</table>
<div class="foot">${esc(t("receipt.contact"))}: ${esc(CONTACT_EMAIL)}</div>
<button onclick="window.print()">${esc(t("receipt.print"))}</button>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
