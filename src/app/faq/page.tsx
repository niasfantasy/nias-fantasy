export default function FAQPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white md:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <a
  href="/"
  className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#C8A96B]"
>
  ← Zurück zur Startseite
</a>
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
            Fragen & Antworten
          </p>

          <h1 className="text-4xl font-semibold md:text-5xl">
            Q&A
          </h1>
        </div>

        <div className="space-y-4">
          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">
              Wie läuft die Personalisierung ab?
            </summary>

            <p className="mt-4 leading-relaxed text-white/65">
              Du gibst bei deiner Bestellung den gewünschten Namen an.
              Das Produkt wird individuell für dich vorbereitet und entsprechend
              der Produktbeschreibung personalisiert.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">
              Wie erhalte ich mein Proof-Pic?
            </summary>

            <p className="mt-4 leading-relaxed text-white/65">
              Das Proof-Pic wird nach der Anfertigung digital an die bei der
              Bestellung angegebene E-Mail-Adresse gesendet.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">
              Wie lange dauert die Anfertigung?
            </summary>

            <p className="mt-4 leading-relaxed text-white/65">
              Da jedes personalisierte Produkt individuell angefertigt wird,
              kann die Bearbeitungszeit variieren. Über den Versand wirst du
              per E-Mail informiert.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">
              Wie erfolgt der Versand?
            </summary>

            <p className="mt-4 leading-relaxed text-white/65">
              Der Versand erfolgt diskret an die von dir angegebene Lieferadresse.
              Die Versandkosten werden dir vor Abschluss der Bestellung angezeigt.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">
              Kann ich meine Bestellung widerrufen?
            </summary>

            <p className="mt-4 leading-relaxed text-white/65">
              Bei individuell nach deinen Angaben angefertigten Waren kann das
              gesetzliche Rücktrittsrecht ausgeschlossen sein. Weitere
              Informationen findest du in den AGB und auf der Widerrufsseite.
            </p>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">
              Muss ich mindestens 18 Jahre alt sein?
            </summary>

            <p className="mt-4 leading-relaxed text-white/65">
              Ja. Das Angebot von Nia&apos;s Fantasy richtet sich ausschließlich
              an volljährige Personen.
            </p>
          </details>
        </div>
      </div>
    </main>
  );
}