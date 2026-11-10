import type { TFunction } from "i18next";
import type { Villa } from "@/data/villa";

// Villa matnlari bazada o'zbekcha saqlanadi. Boshqa tillardagi tarjimalar
// locales/*.json dagi "villaData" bo'limidan olinadi. Tarjima topilmasa
// (masalan, yangi qo'shilgan villa), baza matni ko'rsatiladi.
export function villaText(
  t: TFunction,
  villa: Pick<Villa, "id" | "name" | "location" | "description">,
) {
  return {
    name: t(`villaData.${villa.id}.name`, { defaultValue: villa.name }),
    location: t(`villaData.${villa.id}.location`, {
      defaultValue: villa.location,
    }),
    description: t(`villaData.${villa.id}.description`, {
      defaultValue: villa.description,
    }),
  };
}

export function countryName(t: TFunction, country: string) {
  return t(`country.${country}`, { defaultValue: country });
}

export function amenityName(t: TFunction, amenity: string) {
  return t(`amenity.${amenity}`, { defaultValue: amenity });
}
