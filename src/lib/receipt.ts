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

const money = (n: number) => `$${n.toFixed(2)}`;

// Brend belgisi (saytdagi favicon bilan bir xil: yashil kvadrat, uy + barg)
const LOGO = `<svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#2f7d4f"/><path d="M16 32 32 18l16 14v15a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round"/><path d="M32 44c-5-2-6-8-2-12 5 0 8 4 2 12z" fill="#fff"/></svg>`;

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#eceff1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,"Noto Sans KR","Malgun Gothic",sans-serif;color:#222}
.page{position:relative;width:794px;min-height:1000px;margin:24px auto;background:#fff;overflow:hidden;padding:64px 56px 70px;box-shadow:0 2px 14px rgba(0,0,0,.12);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.deco{position:absolute;pointer-events:none}.tr{top:0;right:0}.bl{bottom:0;left:0}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;color:#2f4a3a;position:relative}
.brand small{display:block;font-weight:400;font-size:10px;color:#7a8a80;letter-spacing:.04em}
h1{font-size:34px;letter-spacing:.28em;font-weight:800;margin:26px 0 22px;color:#2b2b2b;position:relative}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 40px;font-size:13px;line-height:1.55;margin-bottom:30px;position:relative}
.meta b{font-weight:700}.meta .lbl{color:#222}.meta div{color:#555}
.items{width:100%;border-collapse:collapse;margin-top:6px;position:relative}
.items thead th{background:#e6ebe8;text-align:left;font-size:11px;letter-spacing:.2em;text-transform:uppercase;padding:16px 14px;font-weight:700;color:#333}
.items th:nth-child(n+2),.items td:nth-child(n+2){text-align:right}
.items td{padding:18px 14px;font-size:13px;color:#444;border-bottom:1px solid #cfd6d2}
.items td small{display:block;color:#888;font-size:11.5px;margin-top:3px}
.tot{display:flex;justify-content:flex-end;align-items:center;gap:36px;margin:22px 14px 0 0;position:relative}
.tot .bar{width:34px;height:3px;background:#2f7d4f;margin-right:auto;margin-left:14px}
.tot span{font-size:12px;letter-spacing:.2em;font-weight:700}.tot strong{font-size:17px}
.info{display:grid;grid-template-columns:1fr 1fr;gap:20px 40px;margin-top:34px;font-size:12.5px;line-height:1.6;color:#555;position:relative}
.info b{color:#222}
.actions{text-align:center;margin:0 auto 24px}
.actions button{padding:9px 20px;font-size:14px;cursor:pointer;border:1px solid #2f7d4f;background:#2f7d4f;color:#fff;border-radius:6px}
@page{size:A4;margin:0}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;width:100%;min-height:100vh}.actions{display:none}}
`;

// Burchak bezaklari (SVG)
const DECO_TR = `<svg class="deco tr" width="260" height="190" viewBox="0 0 260 190"><path d="M60 0h200v190C250 90 170 20 60 0z" fill="#2f7d4f" opacity=".92"/><path d="M110 0h150v120C230 60 180 20 110 0z" fill="#8a9690" opacity=".75"/></svg>`;
const DECO_BL = `<svg class="deco bl" width="240" height="170" viewBox="0 0 240 170"><path d="M0 0c70 20 150 70 170 170H0z" fill="#2f7d4f" opacity=".92"/><path d="M0 50c40 20 90 50 110 120H0z" fill="#8a9690" opacity=".7"/></svg>`;

// Chekni yangi oynada ochib, chop etish (PDF sifatida saqlash) dialogini ko'rsatadi.
// Brauzer shriftlari ishlatiladi, shuning uchun barcha tillar (uz/en/ru/ko) to'g'ri chiqadi.
export function openReceipt(t: TFunction, r: ReceiptData) {
  const n = nights(r.checkIn, r.checkOut);
  const perNight = r.total / n;
  const issued = (r.paidAt ?? new Date().toISOString()).slice(0, 10);
  const no = String(r.id).padStart(6, "0");
  const method = r.paidAt ? t("receipt.methodCard") : t("receipt.methodPending");

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t("receipt.title"))} #${no}</title><style>${CSS}</style></head><body>
<div class="actions"><button onclick="window.print()">${esc(t("receipt.print"))}</button></div>
<div class="page">
${DECO_TR}${DECO_BL}
<div class="brand">${LOGO}<div>WILD HAVEN<small>${esc(t("receipt.tagline"))}</small></div></div>
<h1>${esc(t("receipt.title")).toUpperCase()}</h1>
<div class="meta">
  <div><span class="lbl"><b>${esc(t("receipt.issued"))}:</b></span> ${esc(issued)}</div>
  <div><span class="lbl"><b>${esc(t("receipt.no"))}</b></span> ${no}</div>
  <div><span class="lbl"><b>${esc(t("receipt.billedTo"))}:</b></span><br>${esc(r.email ?? "—")}<br>${esc(t("receipt.guestsLine", { count: r.guests }))}</div>
  <div><span class="lbl"><b>${esc(t("receipt.from"))}:</b></span><br>Wild Haven<br>${esc(CONTACT_EMAIL)}</div>
</div>
<table class="items">
<thead><tr><th>${esc(t("receipt.item"))}</th><th>${esc(t("receipt.qty"))}</th><th>${esc(t("receipt.price"))}</th><th>${esc(t("receipt.amount"))}</th></tr></thead>
<tbody><tr>
<td>${esc(r.villaName)}<small>${esc(r.checkIn)} — ${esc(r.checkOut)}</small></td>
<td>${esc(t("receipt.nights", { count: n }))}</td><td>${money(perNight)}</td><td>${money(r.total)}</td></tr></tbody>
</table>
<div class="tot"><div class="bar"></div><span>${esc(t("receipt.total")).toUpperCase()}</span><strong>${money(r.total)}</strong></div>
<div class="info">
  <div><b>${esc(t("receipt.method"))}:</b> ${esc(method)}<br><b>${esc(t("receipt.status"))}:</b> ${esc(r.paidAt ? t("receipt.paid") : t("receipt.confirmedUnpaid"))}<br><b>${esc(t("receipt.note"))}:</b> ${esc(t("receipt.thanks"))}</div>
  <div><b>${esc(t("receipt.contact"))}:</b><br>${esc(CONTACT_EMAIL)}</div>
</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
