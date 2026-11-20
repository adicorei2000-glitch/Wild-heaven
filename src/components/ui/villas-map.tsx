import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { villaText } from "@/i18n/villa";
import type { Villa } from "@/data/villa";

interface Props {
  villas: Villa[];
  onOpen: (id: number) => void;
}

// Barcha villalar bitta xaritada (OpenStreetMap, kalit kerak emas). Marker bosilsa qisqa ma'lumot chiqadi.
function VillasMap({ villas, onOpen }: Props) {
  const { t } = useTranslation();
  const el = useRef<HTMLDivElement>(null);
  const withCoords = useMemo(() => villas.filter((v) => v.lat !== null && v.lng !== null), [villas]);

  useEffect(() => {
    if (!el.current || withCoords.length === 0) return;
    const map = L.map(el.current, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const points: L.LatLngTuple[] = [];
    for (const v of withCoords) {
      const pos: L.LatLngTuple = [v.lat as number, v.lng as number];
      points.push(pos);
      const text = villaText(t, v);

      const icon = L.divIcon({
        className: "",
        iconSize: [0, 0],
        html: `<div class="-translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-md ring-1 ring-black/10">$${v.price}</div>`,
      });

      // Matnlarni innerHTML bilan emas, textContent bilan qo'yamiz (XSS'dan himoya)
      const box = document.createElement("div");
      const title = document.createElement("p");
      title.textContent = text.name;
      title.style.cssText = "margin:0;font-weight:600";
      const sub = document.createElement("p");
      sub.textContent = `${text.location} · $${v.price} ${t("common.perNight")}`;
      sub.style.cssText = "margin:2px 0 6px;font-size:12px";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = t("map.viewVilla");
      btn.style.cssText = "cursor:pointer;font-weight:600;text-decoration:underline;background:none;border:0;padding:0";
      btn.onclick = () => onOpen(v.id);
      box.append(title, sub, btn);

      L.marker(pos, { icon, title: text.name }).addTo(map).bindPopup(box);
    }

    if (points.length === 1) map.setView(points[0], 11);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });

    return () => {
      map.remove();
    };
  }, [withCoords, t, onOpen]);

  if (withCoords.length === 0) {
    return <p className="rounded-xl border p-8 text-center text-muted-foreground">{t("map.noCoords")}</p>;
  }
  return <div ref={el} className="z-0 h-[70vh] min-h-80 w-full rounded-xl border" />;
}

export default VillasMap;
