export interface Villa {
  id: number;
  name: string;
  location: string;
  price: number;
  image: string;
  rating: number;
}

export const villas: Villa[] = [
  {
    id: 1,
    name: "Ko'l bo'yidagi villa",
    location: "Shveytsariya, Lugano",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Tog' qo'ynidagi uy",
    location: "Italiya, Como",
    price: 380,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200",
    rating: 4.8,
  },
  {
    id: 3,
    name: "Zamonaviy villa",
    location: "Ispaniya, Marbella",
    price: 520,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
    rating: 5.0,
  },
  {
    id: 4,
    name: "Tinch boshpana",
    location: "Fransiya, Provans",
    price: 340,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200",
    rating: 4.7,
  },
];
