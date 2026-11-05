import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Villa } from "@/data/villa";
import FavoriteButton from "@/components/ui/favorite-button";

interface VillaCardProps {
  villa: Villa;
  favorite?: boolean;
  onToggleFavorite?: (villaId: number) => void;
}

function VillaCard({ villa, favorite = false, onToggleFavorite }: VillaCardProps) {
  return (
    <div className="relative">
      <Link
        to={`/villa/${villa.id}`}
        className="group block overflow-hidden rounded-xl border hover:shadow-lg transition-shadow"
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={villa.image}
            alt={villa.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg">{villa.name}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {villa.rating}
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-2">{villa.location}</p>
          <p className="font-medium">
            ${villa.price}{" "}
            <span className="text-muted-foreground text-sm">/ kecha</span>
          </p>
        </div>
      </Link>

      {onToggleFavorite && (
        <FavoriteButton
          active={favorite}
          onToggle={() => onToggleFavorite(villa.id)}
          className="absolute top-3 right-3"
        />
      )}
    </div>
  );
}

export default VillaCard;
