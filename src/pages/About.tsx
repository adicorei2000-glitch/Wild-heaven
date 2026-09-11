import aboutImage from "@/assets/xom.jpg";

function About() {
  return (
    <div>
      <section
        className="relative h-[50vh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${aboutImage})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tabiat bilan uyg'unlikda
          </h1>
          <p className="text-lg text-white/90 max-w-xl mx-auto">
            Wild Haven — dunyoning eng go'zal burchaklarida joylashgan noyob
            villalar
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Bizning hikoyamiz</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Wild Haven 2020-yilda bir oddiy g'oyadan tug'ildi — odamlarga shahar
            shovqinidan uzoqda, tabiat bilan yuzma-yuz turadigan joylarni
            topishga yordam berish. Biz har bir villani o'z qo'limiz bilan
            tanlaymiz, ularning manzarasi, qulayligi va atmosferasini shaxsan
            tekshiramiz.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Bugungi kunda biz mingdan ortiq mehmonlarga unutilmas dam olish
            tajribasini taqdim etganmiz — tog' etaklaridagi uylardan tortib,
            ko'l bo'yidagi hashamatli villalargacha.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 pt-16 border-t text-center">
          <div>
            <p className="text-5xl font-bold text-primary">150+</p>
            <p className="text-muted-foreground mt-2">Tanlangan villalar</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-primary">30+</p>
            <p className="text-muted-foreground mt-2">Mamlakatlar</p>
          </div>
          <div>
            <p className="text-5xl font-bold text-primary">10,000+</p>
            <p className="text-muted-foreground mt-2">Mamnun mehmonlar</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
