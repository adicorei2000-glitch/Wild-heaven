import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-3">Wild Haven</h3>
            <p className="text-sm leading-relaxed">
              {t("footer.about")}

            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.links")}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.login")}
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.signup")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.help")}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Dialog>
                  <DialogTrigger className="hover:text-white transition-colors">
                    {t("footer.faq")}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("footer.faq")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          {t("footer.faqBookingQ")}
                        </p>
                        <p>
                          {t("footer.faqBookingA")}

                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground mb-1">
                          {t("footer.faqPaymentQ")}
                        </p>
                        <p>
                          {t("footer.faqPaymentA")}

                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </li>

              <li>
                <Dialog>
                  <DialogTrigger className="hover:text-white transition-colors">
                    {t("footer.cancelPolicy")}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("footer.cancelPolicy")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      {t("footer.cancelPolicyText")}


                    </p>
                  </DialogContent>
                </Dialog>
              </li>

              <li>
                <Dialog>
                  <DialogTrigger className="hover:text-white transition-colors">
                    {t("footer.privacy")}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("footer.privacy")}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      {t("footer.privacyText")}


                    </p>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("footer.contact")}</h4>
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
            {t("footer.rights", { year: new Date().getFullYear() })}

          </p>
          <p>{t("footer.madeWithLove")}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
