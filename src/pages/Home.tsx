import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero2.jpg";
import VillaCard from "@/components/ui/Villacards";
import { villas } from "@/data/villa";
function Home() {
  return (
    <>
      <section
        className="relative h-[calc(100vh-73px)] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 text-center text-white px-4 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            O'z jannatingizni toping
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Dunyoning eng go'zal joylarida ajoyib villalarni bron qiling
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("villalar")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Joylarni ko'rish
            </Button>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20"
              >
                Ko'proq bilish
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="villalar" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Mashhur villalar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {villas.map((villa) => (
            <VillaCard key={villa.id} villa={villa} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
