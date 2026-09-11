import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-3">Wild Haven</h3>
            <p className="text-sm leading-relaxed">
              Tabiat qo'ynidagi eng go'zal villalarni bron qilish platformasi.
              Har bir joy sizga unutilmas tajriba taqdim etadi.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Havolalar</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Bosh sahifa
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  Biz haqimizda
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Kirish
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="hover:text-white transition-colors"
                >
                  Ro'yxatdan o'tish
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Yordam</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Dialog>
                  <DialogTrigger className="hover:text-white transition-colors">
                    Ko'p so'raladigan savollar
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ko'p so'raladigan savollar</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          Qanday bron qilish mumkin?
                        </p>
                        <p>
                          Xohlagan villangizni tanlang, sanalarni belgilang va
                          "Bron qilish" tugmasini bosing.
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          To'lov qanday amalga oshiriladi?
                        </p>
                        <p>
                          To'lovni bank kartasi orqali xavfsiz tarzda amalga
                          oshirishingiz mumkin.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </li>

              <li>
                <Dialog>
                  <DialogTrigger className="hover:text-white transition-colors">
                    Bekor qilish siyosati
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bekor qilish siyosati</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Bron qilingan kundan 48 soat oldin bekor qilinsa,
                      to'lovning 100% qaytariladi. Undan keyin bekor qilinsa,
                      qaytarish amalga oshirilmaydi.
                    </p>
                  </DialogContent>
                </Dialog>
              </li>

              <li>
                <Dialog>
                  <DialogTrigger className="hover:text-white transition-colors">
                    Maxfiylik siyosati
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Maxfiylik siyosati</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Sizning shaxsiy ma'lumotlaringiz faqat bron qilish
                      jarayonini amalga oshirish uchun ishlatiladi va uchinchi
                      shaxslarga berilmaydi.
                    </p>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Aloqa</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                info@wildhaven.uz
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +998 90 220 00 20
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                Namangan,Toshkent, O'zbekiston
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <p>
            © {new Date().getFullYear()} Wild Haven. Barcha huquqlar
            himoyalangan.
          </p>
          <p>Sevgi bilan yaratilgan 🌿</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
