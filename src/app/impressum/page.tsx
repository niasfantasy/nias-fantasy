export default function Impressum() {
  return (
    <main className="min-h-screen bg-[#070503] text-white">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black px-6 py-4 md:px-10 lg:px-16">
  <a href="/">
    <img
      src="/nias-fantasy-logo.png"
      alt="Nia's Fantasy"
      className="-ml-2 h-12 w-auto md:ml-0 md:h-16"
    />
  </a>

  <nav className="flex items-center gap-4 text-sm font-medium md:gap-8">
    <a href="/" className="transition hover:text-[#C8A96B]">
      Startseite
    </a>

    <a
      href="/#bestellen"
      className="transition hover:text-[#C8A96B]"
    >
      Shop
    </a>

    <a
      href="/ueber-mich"
      className="transition hover:text-[#C8A96B]"
    >
      Über mich
    </a>
  </nav>
</header>

      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
            Nia&apos;s Fantasy
          </p>

          <h1 className="mb-10 text-4xl font-semibold md:text-5xl">
            Impressum
          </h1>

          <div className="space-y-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-white/80 md:p-10">
            <div>
              <h2 className="mb-3 text-xl font-semibold text-[#C8A96B]">
                Anbieter
              </h2>

              <p>
                Vor- und Nachname / Firmenname
                <br />
                Straße und Hausnummer
                <br />
                PLZ Ort
                <br />
                Österreich
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-[#C8A96B]">
                Kontakt
              </h2>

              <p>
                E-Mail: [E-Mail-Adresse]
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-[#C8A96B]">
                Weitere Angaben
              </h2>

              <p>
                Gewerbe-, Firmenbuch- und Steuerangaben werden hier ergänzt,
                soweit sie auf dein Unternehmen zutreffen.
              </p>
            </div>
          </div>
        </div>
            </section>

      <footer className="mt-auto border-t border-white/10 px-6 pb-12 pt-8 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Nia&apos;s Fantasy</p>

          <div className="flex gap-6">
            <a href="/impressum" className="hover:text-white">
              Impressum
            </a>

            <a href="/datenschutz" className="hover:text-white">
              Datenschutz
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}