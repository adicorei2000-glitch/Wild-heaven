import type { TFunction } from "i18next";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_TELEGRAM } from "@/lib/site";

export interface ReceiptData {
  id: number;
  villaName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  paidAt: string | null;
  email: string | null;
  guestName?: string | null;
  address?: string;
  mapUrl?: string | null;
  amenities?: string[];
  checkInTime: string; // allaqachon tilga mos formatlangan
  checkOutTime: string;
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
.page{position:relative;width:794px;min-height:1123px;margin:24px auto;background:#fff;overflow:hidden;padding:60px 56px 120px;box-shadow:0 2px 14px rgba(0,0,0,.12);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page>*{position:relative}
.deco{position:absolute!important;pointer-events:none}.tr{top:0;right:0}.bl{bottom:0;left:0}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;color:#2f4a3a}
.brand small{display:block;font-weight:400;font-size:10px;color:#7a8a80;letter-spacing:.04em}
h1{font-size:32px;letter-spacing:.26em;font-weight:800;margin:22px 0 18px;color:#2b2b2b}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 40px;font-size:13px;line-height:1.55;margin-bottom:24px}
.meta div{color:#555}.meta b{color:#222}
.items{width:100%;border-collapse:collapse}
.items thead th{background:#e6ebe8;text-align:left;font-size:11px;letter-spacing:.2em;text-transform:uppercase;padding:15px 14px;font-weight:700;color:#333}
.items th:nth-child(n+2),.items td:nth-child(n+2){text-align:right}
.items td{padding:16px 14px;font-size:13px;color:#444;border-bottom:1px solid #cfd6d2}
.items td small{display:block;color:#888;font-size:11.5px;margin-top:3px}
.sums{margin:14px 14px 0 auto;width:300px;font-size:13px;color:#555}
.sums div{display:flex;justify-content:space-between;padding:4px 0}
.sums .grand{border-top:2px solid #2f7d4f;margin-top:8px;padding-top:10px;color:#222}
.sums .grand span{font-size:12px;letter-spacing:.2em;font-weight:700}.sums .grand strong{font-size:18px}
.stay{display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;margin-top:26px;padding:16px 18px;background:#f4f7f5;border-radius:8px;font-size:12.5px;line-height:1.6;color:#555}
.stay b{color:#222}.stay a{color:#2f7d4f}
.info{display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;margin-top:22px;font-size:12.5px;line-height:1.6;color:#555}
.info b{color:#222}
.rules{margin-top:22px;font-size:11.5px;line-height:1.55;color:#666;border-left:3px solid #2f7d4f;padding-left:12px}
.rules b{display:block;color:#222;margin-bottom:2px;font-size:12px}
.qr{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:22px;font-size:11px;color:#777;text-align:right}
.qr svg{width:84px;height:84px}
.actions{text-align:center;margin:0 auto 24px}
.actions button{padding:9px 20px;font-size:14px;cursor:pointer;border:1px solid #2f7d4f;background:#2f7d4f;color:#fff;border-radius:6px}
@page{size:A4;margin:0}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;width:100%;min-height:100vh}.actions{display:none}}
`;

// Burchak bezaklari (SVG)
const DECO_TR = `<svg class="deco tr" width="220" height="160" viewBox="0 0 260 190"><path d="M60 0h200v190C250 90 170 20 60 0z" fill="#2f7d4f" opacity=".92"/><path d="M110 0h150v120C230 60 180 20 110 0z" fill="#8a9690" opacity=".75"/></svg>`;
const DECO_BL = `<svg class="deco bl" width="190" height="135" viewBox="0 0 240 170"><path d="M0 0c70 20 150 70 170 170H0z" fill="#2f7d4f" opacity=".92"/><path d="M0 50c40 20 90 50 110 120H0z" fill="#8a9690" opacity=".7"/></svg>`;

async function qrSvg(url: string): Promise<string> {
  try {
    const QR = await import("qrcode");
    return await QR.toString(url, { type: "svg", margin: 0, color: { dark: "#1f3d2b", light: "#0000" } });
  } catch {
    return "";
  }
}

function buildHtml(t: TFunction, r: ReceiptData, qr: string, bookingUrl: string) {
  const n = nights(r.checkIn, r.checkOut);
  const perNight = r.total / n;
  const issued = (r.paidAt ?? new Date().toISOString()).slice(0, 10);
  const no = String(r.id).padStart(6, "0");
  const method = r.paidAt ? t("receipt.methodCard") : t("receipt.methodPending");
  const contact = [CONTACT_EMAIL, CONTACT_PHONE, CONTACT_TELEGRAM && `Telegram: ${CONTACT_TELEGRAM}`]
    .filter(Boolean)
    .map((x) => esc(x as string))
    .join("<br>");
  const guestLine = [r.guestName, r.email].filter(Boolean).map((x) => esc(x as string)).join("<br>") || "—";
  const address = r.address
    ? `${esc(r.address)}${r.mapUrl ? `<br><a href="${esc(r.mapUrl)}">${esc(t("receipt.openMap"))}</a>` : ""}`
    : "";
  const amenities = r.amenities?.length ? esc(r.amenities.slice(0, 8).join(" · ")) : "";

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t("receipt.title"))} #${no}</title><style>${CSS}</style></head><body>
<div class="actions"><button id="pbtn" type="button">${esc(t("receipt.print"))}</button></div>
<div class="page">
${DECO_TR}${DECO_BL}
<div class="brand">${LOGO}<div>WILD HAVEN<small>${esc(t("receipt.tagline"))}</small></div></div>
<h1>${esc(t("receipt.title")).toUpperCase()}</h1>
<div class="meta">
  <div><b>${esc(t("receipt.issued"))}:</b> ${esc(issued)}</div>
  <div><b>${esc(t("receipt.no"))}</b> ${no}</div>
  <div><b>${esc(t("receipt.billedTo"))}:</b><br>${guestLine}<br>${esc(t("receipt.guestsLine", { count: r.guests }))}</div>
  <div><b>${esc(t("receipt.from"))}:</b><br>Wild Haven<br>${esc(CONTACT_EMAIL)}</div>
</div>
<table class="items">
<thead><tr><th>${esc(t("receipt.item"))}</th><th>${esc(t("receipt.qty"))}</th><th>${esc(t("receipt.price"))}</th><th>${esc(t("receipt.amount"))}</th></tr></thead>
<tbody><tr>
<td>${esc(r.villaName)}<small>${esc(r.checkIn)} — ${esc(r.checkOut)}</small></td>
<td>${esc(t("receipt.nights", { count: n }))}</td><td>${money(perNight)}</td><td>${money(r.total)}</td></tr></tbody>
</table>
<div class="sums">
  <div><span>${esc(t("receipt.subtotal"))}</span><span>${money(r.total)}</span></div>
  <div><span>${esc(t("receipt.taxes"))}</span><span>${esc(t("receipt.taxesIncluded"))}</span></div>
  <div class="grand"><span>${esc(t("receipt.total")).toUpperCase()}</span><strong>${money(r.total)}</strong></div>
</div>
<div class="stay">
  <div><b>${esc(t("receipt.checkInAt", { time: r.checkInTime }))}</b><br><b>${esc(t("receipt.checkOutAt", { time: r.checkOutTime }))}</b></div>
  ${address ? `<div><b>${esc(t("receipt.address"))}:</b><br>${address}</div>` : "<div></div>"}
  ${amenities ? `<div style="grid-column:1/-1"><b>${esc(t("receipt.amenities"))}:</b> ${amenities}</div>` : ""}
</div>
<div class="info">
  <div><b>${esc(t("receipt.method"))}:</b> ${esc(method)}<br><b>${esc(t("receipt.status"))}:</b> ${esc(r.paidAt ? t("receipt.paid") : t("receipt.confirmedUnpaid"))}<br><b>${esc(t("receipt.note"))}:</b> ${esc(t("receipt.thanks"))}</div>
  <div><b>${esc(t("receipt.contact"))}:</b><br>${contact}</div>
</div>
<div class="rules"><b>${esc(t("receipt.rulesTitle"))}</b>${esc(t("bookings.cancelPolicyText"))}<br>${esc(t("receipt.changeRule"))}</div>
${qr ? `<div class="qr"><div>${esc(t("receipt.scanHint"))}</div><a href="${esc(bookingUrl)}">${qr}</a></div>` : ""}
</div>
</body></html>`;
}

// Chekni yangi oynada ochib, chop etish (PDF sifatida saqlash) dialogini ko'rsatadi.
// Brauzer shriftlari ishlatiladi, shuning uchun barcha tillar (uz/en/ru/ko) to'g'ri chiqadi.
export function openReceipt(t: TFunction, r: ReceiptData) {
  // Oyna bosish paytida (sinxron) ochilishi kerak, aks holda brauzer bloklaydi
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(`<!doctype html><title>…</title><body style="font-family:sans-serif;padding:40px">…</body>`);
  w.document.close();
  const bookingUrl = `${window.location.origin}${import.meta.env.BASE_URL}my-bookings`;
  qrSvg(bookingUrl).then((qr) => {
    w.document.open();
    w.document.write(buildHtml(t, r, qr, bookingUrl));
    w.document.close();
    w.document.getElementById("pbtn")?.addEventListener("click", () => w.print());
    setTimeout(() => w.print(), 500);
  });
  return true;
}
