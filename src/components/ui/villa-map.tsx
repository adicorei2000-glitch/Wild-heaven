import { useTranslation } from "react-i18next";

interface Props {
  lat: number;
  lng: number;
  title: string;
}

// OpenStreetMap xaritasi (kalit talab qilmaydi). Joylashuv taxminiy.
function VillaMap({ lat, lng, title }: Props) {
  const { t } = useTranslation();
  const d = 0.06;
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`;
  const big = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`;

  return (
    <div className="border-t pt-6 space-y-3">
      <h2 className="text-xl font-semibold">{t("map.title")}</h2>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        className="h-64 w-full rounded-xl border"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("map.approx")}</span>
        <a href={big} target="_blank" rel="noopener noreferrer" className="underline">
          {t("map.open")}
        </a>
      </div>
    </div>
  );
}

export default VillaMap;
