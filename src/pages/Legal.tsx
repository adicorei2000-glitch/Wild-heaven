import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CONTACT_EMAIL, LEGAL_UPDATED } from "@/lib/site";

interface Section {
  title: string;
  body: string;
}

function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const { t } = useTranslation();
  const sections = t(`legal.${kind}.sections`, { returnObjects: true }) as Section[];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t(`legal.${kind}.title`)}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("legal.updated", { date: LEGAL_UPDATED })}
      </p>
      <p className="mt-6 text-muted-foreground">{t(`legal.${kind}.intro`)}</p>

      <div className="mt-8 space-y-6">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-1 leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        {t("legal.contact")}{" "}
        <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </p>
      <p className="mt-4 text-sm">
        <Link to={kind === "privacy" ? "/terms" : "/privacy"} className="text-primary underline">
          {t(kind === "privacy" ? "footer.terms" : "footer.privacy")}
        </Link>
      </p>
    </div>
  );
}

export default Legal;
