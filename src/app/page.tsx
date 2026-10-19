"use client";

import { useEffect, useState } from "react";
export default function Home() {

  const [quantities, setQuantities] = useState({
  dose05: 0,
  dose025: 0,
  kugelschreiber: 0,
  pet05: 0,
  pet1: 0,
  pet15: 0,
});
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telegramMenuOpen, setTelegramMenuOpen] = useState(false);
const [heroTelegramOpen, setHeroTelegramOpen] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
const [orderStatus, setOrderStatus] = useState<"success" | "error" | "">("");
const [ageConfirmed, setAgeConfirmed] = useState(false);
const [ageCheckDone, setAgeCheckDone] = useState(false);
useEffect(() => {
  const navigationEntry = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming | undefined;

  const isReload = navigationEntry?.type === "reload";

  if (isReload) {
    sessionStorage.removeItem("ageConfirmed");
    setAgeConfirmed(false);
  } else {
    const savedAgeConfirmation =
      sessionStorage.getItem("ageConfirmed");

    setAgeConfirmed(savedAgeConfirmation === "true");
  }

  setAgeCheckDone(true);
}, []);
  const changeQuantity = (
  product: keyof typeof quantities,
  amount: number
) => {
  setQuantities((prev) => {
    const currentTotal = Object.values(prev).reduce(
      (sum, quantity) => sum + quantity,
      0
    );

    if (amount > 0 && currentTotal >= 3) {
      return prev;
    }

    return {
      ...prev,
      [product]: Math.max(0, prev[product] + amount),
    };
  });
};
useEffect(() => {
  fetch("/api/site-view", {
    method: "POST",
  }).catch((error) => {
    console.error("Seitenaufruf konnte nicht gezählt werden:", error);
  });
}, []);
const totalItems = Object.values(quantities).reduce(
  (sum, quantity) => sum + quantity,
  0
);

const hasProducts = totalItems > 0;
const maxItemsReached = totalItems >= 3;

const productPrices = {
  dose05: 199,
  dose025: 149,
  kugelschreiber: 99,
  pet05: 169,
  pet1: 249,
  pet15: 299,
};

const subtotal =
  quantities.dose05 * productPrices.dose05 +
  quantities.dose025 * productPrices.dose025 +
  quantities.kugelschreiber * productPrices.kugelschreiber +
  quantities.pet05 * productPrices.pet05 +
  quantities.pet1 * productPrices.pet1 +
  quantities.pet15 * productPrices.pet15;

const shippingCosts =
  country === "AT"
    ? 7.95
    : country === "DE" || country === "CH"
    ? 14.95
    : 0;

const totalPrice = subtotal + shippingCosts;



const handleOrder = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = e.currentTarget;

  if (isSubmitting) {
    return;
  }

  if (!hasProducts || !country) {
    setOrderMessage(
      "Bitte wähle mindestens ein Produkt und ein Lieferland aus."
    );
    return;
  }

  setIsSubmitting(true);
  setOrderMessage("");

  const formData = new FormData(e.currentTarget);

  const orderData = {
    name: formData.get("name"),
    email: formData.get("email"),
    paymentMethod: formData.get("paymentMethod"),
    land: country,
    adresse: formData.get("adresse"),
    plz: formData.get("plz"),
    ort: formData.get("ort"),
    personalisierung: formData.get("personalisierung"),
    nachricht: formData.get("nachricht"),
    quantities,
    subtotal: subtotal.toFixed(2),
    shippingCosts: shippingCosts.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };

  try {
    const response = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await response.text();

let result: { success?: boolean; error?: string } = {};

if (responseText) {
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error("API-Antwort war kein gültiges JSON:", responseText);
  }
}

if (!response.ok) {
  throw new Error(
    result.error || `Bestellung konnte nicht gesendet werden. Status: ${response.status}`
  );
}
 setOrderStatus("success");  
setOrderMessage("Bestellung wurde erfolgreich übermittelt.");
setTimeout(() => {
  document.getElementById("order-status")?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}, 100);

setQuantities({
  dose05: 0,
  dose025: 0,
  kugelschreiber: 0,
  pet05: 0,
  pet1: 0,
  pet15: 0,
});

setCountry("");

form.reset();
  } catch (error) {
    console.error(error);
   setOrderStatus("error");
    setOrderMessage(
      "Beim Senden der Bestellung ist ein Fehler aufgetreten."
    );
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <main className="bg-black text-white">
      {ageCheckDone && !ageConfirmed && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black px-6">
    <div className="w-full max-w-md rounded-[2rem] border border-[#C8A96B]/30 bg-[#0b0907] p-8 text-center shadow-2xl">
     <img
  src="/nias-fantasy-logo.png"
  alt="Nia's Fantasy"
  className="mx-auto mb-5 h-20 w-auto"
/>

      <h2 className="mb-4 text-3xl font-semibold">
        Bist du mindestens 18 Jahre alt?
      </h2>

      <p className="mb-8 text-sm leading-relaxed text-white/70">
        Diese Website ist nur für volljährige Personen bestimmt.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
        onClick={() => {
  sessionStorage.setItem("ageConfirmed", "true");
  setAgeConfirmed(true);
}}
          className="rounded-full bg-[#C8A96B] px-6 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
        >
          Ja, ich bin 18+
        </button>

        <a
          href="https://www.google.com"
          className="rounded-full border border-white/10 px-6 py-3 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Nein
        </a>
      </div>
    </div>
  </div>
)}
      {/* HERO */}
      <section className="relative min-h-screen bg-black">
  <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
    style={{
      backgroundImage: "url('/hero-mich.jpg')",
    }}
  />

 <div
  className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat bg-fixed md:block"
  style={{
    backgroundImage: "url('/hero-mich.jpg')",
  }}
/>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />

        <div className="relative z-10">
          <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-black px-6 py-4 backdrop-blur-xl md:px-10 lg:px-16">
            <img
              src="/nias-fantasy-logo.png"
              alt="Nia's Fantasy"
              className="-ml-2 h-12 w-auto md:ml-0 md:h-16"
            />

            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
              <a href="#start" className="transition hover:text-[#C8A96B]">
                Startseite
              </a>

              <div
  className="relative"
  onMouseEnter={() => setTelegramMenuOpen(true)}
  onMouseLeave={() => setTelegramMenuOpen(false)}
>
  <button
    type="button"
    className="transition hover:text-[#C8A96B]"
  >
    Telegram
  </button>

  {telegramMenuOpen && (
    <div className="absolute right-0 z-50 mt0 w-52 rounded-2xl border border-white/10 bg-black p-2 shadow-xl backdrop-blur">
      <a
        href="https://t.me/niasfantasy"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl px-4 py-3 transition hover:bg-white/10 hover:text-[#C8A96B]"
      >
        Free Telegram
      </a>

      <a
        href="https://t.me/+Vqsd_f3tNG00NjY8"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl px-4 py-3 transition hover:bg-white/10 hover:text-[#C8A96B]"
      >
        Premium Telegram
      </a>
    </div>
  )}
</div>

              <a href="#bestellen" className="transition hover:text-[#C8A96B]">
                Shop
              </a>

              <a href="/ueber-mich" className="transition hover:text-[#C8A96B]">
                Über mich
              </a>
            </nav>
            <details className="relative md:hidden">
  <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-[#C8A96B]/40 bg-black/40 text-[#E2D1A2] backdrop-blur transition hover:bg-[#C8A96B] hover:text-black">
  <span className="text-2xl leading-none">☰</span>
</summary>

 <div className="absolute right-0 z-50 mt0 w-56 overflow-hidden rounded-2xl border border-[#C8A96B]/25 bg-black p-1.5 shadow-2xl backdrop-blur-xl">
   <a
  href="#start"
  onClick={(e) =>
  e.currentTarget.closest("details")?.removeAttribute("open")
}
  className="mb-1.5 block rounded-xl border border-[#C8A96B]/15 bg-white/[0.04] px-4 py-2.5 font-medium tracking-wide text-white/90 transition hover:border-[#C8A96B]/35 hover:bg-[#C8A96B]/10 hover:text-[#E2D1A2]"
>
  Startseite
</a>

<a
  href="https://t.me/niasfantasy"
  onClick={(e) =>
  e.currentTarget.closest("details")?.removeAttribute("open")
}
  target="_blank"
  rel="noopener noreferrer"
  className="mb-1.5 block rounded-xl border border-[#C8A96B]/15 bg-white/[0.04] px-4 py-2.5 font-medium tracking-wide text-white/90 transition hover:border-[#C8A96B]/35 hover:bg-[#C8A96B]/10 hover:text-[#E2D1A2]"
>
  Free Telegram
</a>

<a
  href="https://t.me/+Vqsd_f3tNG00NjY8"
  onClick={(e) =>
  e.currentTarget.closest("details")?.removeAttribute("open")
}
  target="_blank"
  rel="noopener noreferrer"
  className="block rounded-xl border border-[#C8A96B]/15 bg-white/[0.04] px-4 py-2.5 font-medium tracking-wide text-white/90 transition hover:border-[#C8A96B]/35 hover:bg-[#C8A96B]/10 hover:text-[#E2D1A2]"
>
  Premium Telegram
</a>

<div className="my-2 border-t border-white/10" />

<a
  href="#bestellen"
  onClick={(e) =>
  e.currentTarget.closest("details")?.removeAttribute("open")
}
  className="mb-1.5 block rounded-xl border border-[#C8A96B]/15 bg-white/[0.04] px-4 py-2.5 font-medium tracking-wide text-white/90 transition hover:border-[#C8A96B]/35 hover:bg-[#C8A96B]/10 hover:text-[#E2D1A2]"
>
  Shop
</a>

<a
 href="/ueber-mich"
 onClick={(e) =>
  e.currentTarget.closest("details")?.removeAttribute("open")
}
  className="block rounded-xl border border-[#C8A96B]/15 bg-white/[0.04] px-4 py-2.5 font-medium tracking-wide text-white/90 transition hover:border-[#C8A96B]/35 hover:bg-[#C8A96B]/10 hover:text-[#E2D1A2]"
>
  Über mich
</a>
  </div>
</details>
          </header>

          <div
            id="start"
            className="flex min-h-[calc(100vh-96px)] items-center px-6 pb-16 pt-24 md:px-10 md:pt-28 lg:px-16"
          >
            <div className="max-w-2xl">
              <p className="mb-5 text-xs uppercase tracking-[0.4em] text-[#E2D1A2] md:text-sm">
                Exklusiv · Persönlich · Limitiert
              </p>

            <div className="mb-6">
  <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
    Willkommen bei
  </h1>

  <img
    src="/nias-fantasy-logo.png"
    alt="Nia's Fantasy"
    className="-ml-4 -mt-1 h-32 w-auto md:-ml-7 md:-mt-2 md:h-44 lg:-ml-7 lg:-mt-3 lg:h-52"
  />
</div>

              <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
                Entdecke exklusive Inhalte, persönliche Einblicke und
                individuell angefertigte Unikate.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
              <div
  className="relative"
  onMouseEnter={() => {
    if (window.innerWidth >= 768) {
      setHeroTelegramOpen(true);
    }
  }}
  onMouseLeave={() => {
    if (window.innerWidth >= 768) {
      setHeroTelegramOpen(false);
    }
  }}
>
  <button
    type="button"
    onClick={() => {
      if (window.innerWidth < 768) {
        setHeroTelegramOpen((prev) => !prev);
      }
    }}
    className="flex items-center justify-center gap-2 rounded-full bg-[#C8A96B] px-7 py-4 text-center font-semibold text-black transition hover:bg-[#E2D1A2]"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
      aria-hidden="true"
    >
      <path d="M21.8 3.4 18.7 20c-.2 1.2-.9 1.5-1.9.9l-4.7-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.8 8.7-7.9c.4-.3-.1-.5-.6-.2L6.4 14l-4.6-1.4c-1-.3-1-1 .2-1.5L20 4.1c.8-.3 1.6.2 1.8-.7Z" />
    </svg>

    Telegram-Kanal
  </button>

  {heroTelegramOpen && (
    <div className="absolute left-0 z-50 mt-1 w-48 rounded-2xl border border-white/10 bg-black p-2 shadow-xl backdrop-blur">
      <a
        href="https://t.me/niasfantasy"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl px-4 py-3 text-center text-sm font-medium tracking-wide text-white/90 transition hover:bg-white/10 hover:text-[#C8A96B]"
      >
        Free
      </a>

      <a
        href="https://t.me/+Vqsd_f3tNG00NjY8"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl px-4 py-3 text-center text-sm font-medium tracking-wide text-white/90 transition hover:bg-white/10 hover:text-[#C8A96B]"
      >
        Exclusive
      </a>
    </div>
  )}
</div>

                <a
  href="#bestellen"
  className="flex items-center justify-center gap-2 rounded-full border border-[#C8A96B] px-7 py-4 text-center font-semibold text-[#E2D1A2] transition hover:bg-[#C8A96B] hover:text-black"
>
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-none stroke-current"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>

  Shop entdecken
</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANGEBOTE */}
      <section className="px-6 py-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
              Deine Auswahl
            </p>

            <h2 className="text-4xl font-semibold md:text-5xl">
              Exklusive Angebote
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* FREE TELEGRAM */}
<article
  className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-8 md:p-10"
>
  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
    Kostenlos
  </p>

  <h3 className="mb-4 text-3xl font-semibold">
    Free Telegram
  </h3>

  <p className="mb-8 leading-relaxed text-white/70">
    Kostenlose Einblicke, Vorschauen und regelmäßige Updates direkt im
    Telegram-Kanal.
  </p>

  <div className="mt-auto flex items-end justify-between gap-6">
    <div>
      <span className="text-3xl font-semibold text-[#C8A96B]">
        0 €
      </span>
    </div>

    <a
      href="https://t.me/niasfantasy"
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
    >
      Kostenlos beitreten
    </a>
  </div>
</article>
           
            <article
  className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-8 md:p-10"
>
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
                Premium Zugang
              </p>

              <h3 className="mb-4 text-3xl font-semibold">
                Telegram-Kanal
              </h3>

              <p className="mb-8 leading-relaxed text-white/70">
                Exklusive Einblicke, regelmäßige Inhalte und persönliche
                Momente direkt im privaten Telegram-Kanal.
              </p>

              <div className="mt-auto flex items-end justify-between gap-6">
                <div>
                  <span className="whitespace-nowrap text-3xl font-semibold text-[#C8A96B]">
  20 € / Monat
</span>
                </div>

                <a
  href="https://t.me/+Vqsd_f3tNG00NjY8"
  target="_blank"
  rel="noopener noreferrer"
  className="rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
>
  Mehr erfahren
</a>
              </div>
            </article>

            <article
              id="shop"
              className="rounded-[2rem] border border-[#C8A96B]/30 bg-gradient-to-b from-[#C8A96B]/10 to-white/[0.03] p-8 md:p-10"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
                Individuell
              </p>

              <h3 className="mb-4 text-3xl font-semibold">
                Personalisiertes Unikat
              </h3>

              <p className="mb-8 leading-relaxed text-white/70">
  Dein persönliches Einzelstück – individuell gestaltet, exklusiv inszeniert und fotografisch für dich dokumentiert.
</p>
             <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="text-3xl font-semibold text-[#C8A96B]">
                    ab 99 €
                  </span>
                </div>

                <a
                 href="#bestellen"
                  className="rounded-full bg-[#C8A96B] px-6 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
                >
                  Shop ansehen
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
{/* SHOP BESTELLUNG */}
<section
  id="bestellen"
  className="border-t border-white/10 bg-white/[0.02] px-6 py-20 md:px-10 lg:px-16"
>
  <div className="mx-auto max-w-6xl">

    <div className="mb-12 text-center">
      <img
  src="/nias-fantasy-shop-logo.png"
  alt="Nia's Fantasy"
  className="mx-auto mb-1 h-auto w-[500px] md:w-[650px]"
/>

      <h2 className="text-4xl font-semibold md:text-5xl">
        Dein personalisiertes Unikat
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-white/70">
        Wähle dein Produkt und gib den Namen an, mit dem dein persönliches
        Unikat gestaltet werden soll.
      </p>
    </div>

    {/* PRODUKTE */}
    <div className="mb-16 grid gap-6 md:grid-cols-3">

      <div
  className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-[#C8A96B]/30 bg-cover bg-center p-7"
  style={{
    backgroundImage: "url('/product-bg1.png')",
  }}
>
  <div className="absolute inset-0 bg-black/65" />

  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/85" />

 <div className="relative z-[1]">
    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
      Personalisiert
    </p>

    <h3 className="mb-3 text-2xl font-semibold text-white">
      Dose 0,5l
    </h3>

   <p className="mb-3 text-white/80">
  Dein Name. Mein Moment. Dein personalisiertes Unikat wird von mir Anal verwendet, fotografisch dokumentiert und anschließend an dich per Post versendet.
</p>

<p className="mb-6 text-sm text-white/60">
  Paketumfang: 1× personalisierte 0,5l Dose + 1× Proof-Pic via E-Mail
</p>

    <p className="text-2xl font-semibold text-[#C8A96B]">
      199 €
    </p>

  
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
  <span className="text-sm text-white/70">
    Menge
  </span>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => changeQuantity("dose05", -1)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-lg"
    >
      −
    </button>

    <span className="w-6 text-center">
      {quantities.dose05}
    </span>

    <button
      type="button"
      onClick={() => changeQuantity("dose05", 1)}
      disabled={maxItemsReached}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
        maxItemsReached
          ? "cursor-not-allowed bg-white/10 text-white/30"
          : "bg-[#C8A96B] text-black"
      }`}
    >
      +
    </button>
  </div>
</div>
  </div>
</div>
      <div
  className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-white/10 bg-cover bg-center p-7"
  style={{
    backgroundImage: "url('/product-bg2.png')",
  }}
>
  <div className="absolute inset-0 bg-black/65" />

  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/85" />

 <div className="relative z-[1]">
    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
      Personalisiert
    </p>

    <h3 className="mb-3 text-2xl font-semibold text-white">
      Dose 0,25 l
    </h3>

    <p className="mb-3 text-white/80">
  Dein Name. Mein Moment. Dein personalisiertes Unikat wird von mir Anal verwendet, fotografisch dokumentiert und anschließend an dich per Post versendet.
</p>

<p className="mb-6 text-sm text-white/60">
  Paketumfang: 1× personalisierte 0,25l Dose + 1× Proof-Pic per E-Mail
</p>

    <p className="text-2xl font-semibold text-[#C8A96B]">
      149 €
    </p>

    
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
  <span className="text-sm text-white/70">
    Menge
  </span>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => changeQuantity("dose025", -1)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-lg"
    >
      −
    </button>

    <span className="w-6 text-center">
      {quantities.dose025}
    </span>

    <button
      type="button"
      onClick={() => changeQuantity("dose025", 1)}
      disabled={maxItemsReached}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
        maxItemsReached
          ? "cursor-not-allowed bg-white/10 text-white/30"
          : "bg-[#C8A96B] text-black"
      }`}
    >
      +
    </button>
  </div>
</div>
  </div>
</div>
      
      <div
  className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-white/10 bg-cover bg-center p-7"
  style={{
    backgroundImage: "url('/product-bg3.png')",
  }}
>
  <div className="absolute inset-0 bg-black/65" />

  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/85" />

  <div className="relative z-[1]">
    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
      Personalisiert
    </p>

    <h3 className="mb-3 text-2xl font-semibold text-white">
      Kugelschreiber
    </h3>

    <p className="mb-3 text-white/80">
  Dein Name. Mein Moment. Dein personalisiertes Unikat wird von mir Anal verwendet, fotografisch dokumentiert und anschließend an dich per Post versendet.
</p>

<p className="mb-6 text-sm text-white/60">
  Paketumfang: 1× personalisierter Kugelschreiber + 1× Proof-Pic via E-Mail
</p>

    <p className="text-2xl font-semibold text-[#C8A96B]">
      99 €
    </p>

   
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
  <span className="text-sm text-white/70">
    Menge
  </span>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => changeQuantity("kugelschreiber", -1)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-lg"
    >
      −
    </button>

    <span className="w-6 text-center">
      {quantities.kugelschreiber}
    </span>

    <button
      type="button"
      onClick={() => changeQuantity("kugelschreiber", 1)}
      disabled={maxItemsReached}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
        maxItemsReached
          ? "cursor-not-allowed bg-white/10 text-white/30"
          : "bg-[#C8A96B] text-black"
      }`}
    >
      +
    </button>
  </div>
</div>
  </div>
</div>
      <div
  className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-white/10 bg-cover bg-center p-7"
 style={{
  backgroundImage: "url('/product-bg4.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
>
  <div className="absolute inset-0 bg-black/80" />

  

 <div className="relative z-[1]">
    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
      Personalisiert
    </p>

    <h3 className="mb-3 text-2xl font-semibold text-white">
      PET-Flasche 0,5 l
    </h3>

    <p className="mb-3 text-white/80">
  Dein Name. Mein Moment. Dein personalisiertes Unikat wird von mir Anal verwendet, fotografisch dokumentiert und anschließend an dich per Post versendet.
</p>

<p className="mb-6 text-sm text-white/60">
  Paketumfang: 1× personalisierte 0,5l PET Flasche + 1× Proof-Pic via E-Mail
</p>

    <p className="text-2xl font-semibold text-[#C8A96B]">
      169 €
    </p>

    
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
  <span className="text-sm text-white/70">
    Menge
  </span>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => changeQuantity("pet05", -1)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-lg"
    >
      −
    </button>

    <span className="w-6 text-center">
      {quantities.pet05}
    </span>

    <button
      type="button"
      onClick={() => changeQuantity("pet05", 1)}
      disabled={maxItemsReached}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
        maxItemsReached
          ? "cursor-not-allowed bg-white/10 text-white/30"
          : "bg-[#C8A96B] text-black"
      }`}
    >
      +
    </button>
  </div>
</div>
  </div>
</div>

      

<div
  className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-white/10 bg-cover bg-center p-7"
  style={{
    backgroundImage: "url('/product-bg5.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  <div className="absolute inset-0 bg-black/80" />


  <div className="relative z-[1]">
    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
      Personalisiert
    </p>

    <h3 className="mb-3 text-2xl font-semibold text-white">
      PET-Flasche 1 l
    </h3>

    <p className="mb-3 text-white/80">
  Dein Name. Mein Moment. Dein personalisiertes Unikat wird von mir Anal verwendet, fotografisch dokumentiert und anschließend an dich per Post versendet.
</p>

<p className="mb-6 text-sm text-white/60">
  Paketumfang: 1× personalisierte 1,0l PET Flasche + 1× Proof-Pic via E-Mail
</p>

    <p className="text-2xl font-semibold text-[#C8A96B]">
      249 €
    </p>

   
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
  <span className="text-sm text-white/70">
    Menge
  </span>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => changeQuantity("pet1", -1)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-lg"
    >
      −
    </button>

    <span className="w-6 text-center">
      {quantities.pet1}
    </span>

    <button
      type="button"
      onClick={() => changeQuantity("pet1", 1)}
      disabled={maxItemsReached}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
        maxItemsReached
          ? "cursor-not-allowed bg-white/10 text-white/30"
          : "bg-[#C8A96B] text-black"
      }`}
    >
      +
    </button>
  </div>
</div>
  </div>
</div>

<div
  className="relative min-h-[250px] overflow-hidden rounded-[2rem] border border-white/10 bg-cover bg-center p-7"
  style={{
    backgroundImage: "url('/product-bg6.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  <div className="absolute inset-0 bg-black/80" />

  

  <div className="relative z-[1]">
    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#C8A96B]">
      Personalisiert
    </p>

    <h3 className="mb-3 text-2xl font-semibold text-white">
      PET-Flasche 1,5 l
    </h3>

    <p className="mb-3 text-white/80">
  Dein Name. Mein Moment. Dein personalisiertes Unikat wird von mir Anal verwendet, fotografisch dokumentiert und anschließend an dich per Post versendet.
</p>

<p className="mb-6 text-sm text-white/60">
  Paketumfang: 1× personalisierte 1,5l PET Flasche + 1× Proof-Pic via E-Mail
</p>

    <p className="text-2xl font-semibold text-[#C8A96B]">
      299 €
    </p>

    
    <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
  <span className="text-sm text-white/70">
    Menge
  </span>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => changeQuantity("pet15", -1)}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black text-lg"
    >
      −
    </button>

    <span className="w-6 text-center">
      {quantities.pet15}
    </span>

    <button
      type="button"
      onClick={() => changeQuantity("pet15", 1)}
      disabled={maxItemsReached}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold ${
        maxItemsReached
          ? "cursor-not-allowed bg-white/10 text-white/30"
          : "bg-[#C8A96B] text-black"
      }`}
    >
      +
    </button>
  </div>
</div>
  </div>
</div>
    </div>

    {/* BESTELLFORMULAR */}
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 md:p-10">

      <h3 className="mb-8 text-3xl font-semibold">
        Bestellung
      </h3>

     <form
  onSubmit={handleOrder}
  className="space-y-6"
>

        
<div>
  <label className="mb-4 block text-sm text-white/70">
    Ausgewählte Produkte
  </label>

  <div className="space-y-3">
    {[
      ["dose05", "Dose 0,5 l", "199 €"],
      ["dose025", "Dose 0,25 l", "149 €"],
      ["kugelschreiber", "Kugelschreiber", "99 €"],
      ["pet05", "PET-Flasche 0,5 l", "169 €"],
      ["pet1", "PET-Flasche 1 l", "249 €"],
      ["pet15", "PET-Flasche 1,5 l", "299 €"],
    ]
      .filter(
        ([key]) =>
          quantities[key as keyof typeof quantities] > 0
      )
      .map(([key, name, price]) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-[#C8A96B]">{price}</p>
          </div>

          <div className="text-lg font-semibold text-white">
            {quantities[key as keyof typeof quantities]}×
          </div>
        </div>
      ))}

    {!hasProducts && (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
        Noch kein Produkt ausgewählt.
      </div>
    )}
  </div>
</div>

        <div>
          <label className="mb-2 block text-sm text-white/70">
            Gewünschter Name für die Personalisierung
          </label>

          <div className="relative">
  <input
    type="text"
    name="personalisierung"
    required
    maxLength={25}
    placeholder="z. B. Michael"
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 pr-28 text-white outline-none placeholder:text-white/30 focus:border-[#C8A96B]"
  />

  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">
    max. 25 Zeichen
  </span>
</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Vor- und Nachname
            </label>

            <input
              type="text"
              name="name"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              E-Mail-Adresse
            </label>

            <input
              type="email"
              name="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
            />
          </div>
        </div>
<div>
  <label className="mb-2 block text-sm text-white/70">
    Land
  </label>

 <select
  name="land"
  required
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
>
  <option value="">Land auswählen</option>
  <option value="AT">Österreich</option>
  <option value="DE">Deutschland</option>
  <option value="CH">Schweiz</option>
</select>
  
</div>
        <div>
          <label className="mb-2 block text-sm text-white/70">
            Straße & Hausnummer
          </label>

          <input
            type="text"
            name="adresse"
            required
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">

          <div>
            <label className="mb-2 block text-sm text-white/70">
              PLZ
            </label>

            <input
              type="text"
              name="plz"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/70">
              Ort
            </label>

            <input
              type="text"
              name="ort"
              required
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
            />
          </div>

        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">
            Anmerkung zur Bestellung
          </label>

          <textarea
            name="nachricht"
            rows={4}
            placeholder="Optional"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-[#C8A96B]"
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
  <h4 className="mb-5 text-lg font-semibold">
    Bestellübersicht
  </h4>

  <div className="space-y-3 text-sm">
    {quantities.dose05 > 0 && (
  <div className="flex justify-between text-white/70">
    <span>Dose 0,5 l × {quantities.dose05}</span>
    <span>{(quantities.dose05 * 199).toFixed(2).replace(".", ",")} €</span>
  </div>
)}

{quantities.dose025 > 0 && (
  <div className="flex justify-between text-white/70">
    <span>Dose 0,25 l × {quantities.dose025}</span>
    <span>{(quantities.dose025 * 149).toFixed(2).replace(".", ",")} €</span>
  </div>
)}

{quantities.kugelschreiber > 0 && (
  <div className="flex justify-between text-white/70">
    <span>Kugelschreiber × {quantities.kugelschreiber}</span>
    <span>{(quantities.kugelschreiber * 99).toFixed(2).replace(".", ",")} €</span>
  </div>
)}

{quantities.pet05 > 0 && (
  <div className="flex justify-between text-white/70">
    <span>PET-Flasche 0,5 l × {quantities.pet05}</span>
    <span>{(quantities.pet05 * 169).toFixed(2).replace(".", ",")} €</span>
  </div>
)}

{quantities.pet1 > 0 && (
  <div className="flex justify-between text-white/70">
    <span>PET-Flasche 1 l × {quantities.pet1}</span>
    <span>{(quantities.pet1 * 249).toFixed(2).replace(".", ",")} €</span>
  </div>
)}

{quantities.pet15 > 0 && (
  <div className="flex justify-between text-white/70">
    <span>PET-Flasche 1,5 l × {quantities.pet15}</span>
    <span>{(quantities.pet15 * 299).toFixed(2).replace(".", ",")} €</span>
  </div>
)}
    

    <div className="flex justify-between text-white/70">
      <span>Warenwert</span>
      <span>{subtotal.toFixed(2).replace(".", ",")} €</span>
    </div>
    



    <div className="flex justify-between text-white/70">
      <span>Versand</span>
      <span>
        {country
          ? `${shippingCosts.toFixed(2).replace(".", ",")} €`
          : "Land auswählen"}
      </span>
    </div>

    <div className="border-t border-white/10 pt-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          Gesamt
        </span>

        <span className="text-2xl font-semibold text-[#C8A96B]">
          {country
            ? `${totalPrice.toFixed(2).replace(".", ",")} €`
            : `${subtotal.toFixed(2).replace(".", ",")} €`}
        </span>
      </div>
    </div>
  </div>
</div>

<div className="rounded-2xl border border-[#C8A96B]/30 bg-[#C8A96B]/10 p-5">
  <p className="font-semibold text-[#E2D1A2]">
    Gesetzliches Gewährleistungsrecht
  </p>

  <p className="mt-2 text-sm leading-relaxed text-white/70">
    Für Waren besteht ein gesetzliches Gewährleistungsrecht.
    Dieses gilt grundsätzlich für Mängel, die bereits bei der
    Übergabe der Ware vorhanden waren. Die gesetzliche
    Mindestdauer beträgt zwei Jahre.
  </p>
</div>

<label className="flex items-start gap-3 text-sm text-white/60">
          <input
            type="checkbox"
            required
            className="mt-1"
          />

          <span>
  Ich bestätige, dass meine Angaben korrekt sind, ich die
  <a
    href="/agb"
    target="_blank"
    rel="noopener noreferrer"
    className="mx-1 text-[#C8A96B] underline underline-offset-4"
  >
    AGB
  </a>
  gelesen habe und die Bestellung kostenpflichtig absenden möchte.
  Mir ist bekannt, dass für individuell nach meinen Angaben
  angefertigte Waren kein gesetzliches Rücktrittsrecht besteht,
  soweit die Voraussetzungen des § 18 FAGG erfüllt sind.
</span>
        </label>
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
  <p className="mb-4 text-xs uppercase tracking-[0.25em] text-[#C8A96B]">
    Zahlungsart
  </p>

  <div className="flex items-center gap-3 rounded-2xl border border-[#C8A96B]/30 bg-[#C8A96B]/10 px-4 py-4">
    <input
      type="radio"
      id="payment-bank"
      name="paymentMethod"
      value="bank_transfer"
      defaultChecked
      className="h-4 w-4"
    />

    <label
      htmlFor="payment-bank"
      className="cursor-pointer font-medium"
    >
      Vorkasse per Banküberweisung
    </label>
  </div>

  <p className="mt-3 text-sm leading-relaxed text-white/50">
    Die Bankdaten und den Verwendungszweck erhältst du nach der Bestellung per E-Mail.
  </p>
</div>

        <button
  type="submit"
  disabled={isSubmitting}
  className={`w-full rounded-full px-8 py-4 text-lg font-semibold transition ${
    isSubmitting
      ? "cursor-not-allowed bg-white/10 text-white/30"
      : "bg-[#C8A96B] text-black hover:bg-[#E2D1A2]"
  }`}
  
>
  {isSubmitting ? "Bestellung wird gesendet..." : "Kostenpflichtig bestellen"}
</button>
{orderMessage && (
  <div
    id="order-status"
    className={`rounded-2xl border px-5 py-4 text-center ${
      orderStatus === "success"
        ? "border-green-400/20 bg-green-400/10"
        : "border-red-400/20 bg-red-400/10"
    }`}
  >
    <p
      className={`font-medium ${
        orderStatus === "success"
          ? "text-green-300"
          : "text-red-300"
      }`}
    >
      {orderMessage}
    </p>
  </div>
)}
      </form>
    </div>

  </div>
</section>
      {/* ÜBER MICH */}
      <section
        id="about"
        className="border-y border-white/10 bg-white/[0.03] px-6 py-20 md:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-4xl text-center">
         

          <h2 className="mb-6 text-4xl font-semibold md:text-5xl">
            Persönlich. Diskret. Exklusiv.
          </h2>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/70">
            Hier findest du exklusive Inhalte und individuell gestaltete
            Angebote in einem persönlichen und hochwertigen Rahmen.
          </p>
        </div>
      </section>

      {/* VERTRAUEN */}
      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Diskret", "Vertraulicher Umgang"],
            ["Persönlich", "Individuell gestaltet"],
            ["Limitiert", "Nur begrenzt verfügbar"],
            ["Exklusiv", "Besondere Inhalte"],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
            >
              <h3 className="mb-2 text-lg font-semibold text-[#C8A96B]">
                {title}
              </h3>
              <p className="text-sm text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </section>
<section className="border-t border-white/10 px-6 py-16 md:px-10 lg:px-16">
  <div className="mx-auto max-w-4xl text-center">
    <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
      Noch Fragen?
    </p>

    <h2 className="text-3xl font-semibold md:text-4xl">
      Fragen & Antworten
    </h2>

    <p className="mx-auto mt-4 max-w-2xl text-white/60">
      Hier findest du Antworten zu Personalisierung, Proof-Pic, Versand,
      Widerruf und Altersbeschränkung.
    </p>

    <a
      href="/faq"
      className="mt-8 inline-flex rounded-full bg-[#C8A96B] px-8 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
    >
      Zum Q&A
    </a>
  </div>
</section>
      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 pb-20 pt-8 md:px-10 md:pb-12 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Nia&apos;s Fantasy</p>

          <div className="flex flex-wrap gap-6">
  <a href="/impressum" className="hover:text-white">
    Impressum
  </a>

  <a href="/datenschutz" className="hover:text-white">
    Datenschutz
  </a>

  <a href="/agb" className="hover:text-white">
    AGB
  </a>

  <a href="/widerruf" className="hover:text-white">
    Widerruf
  </a>
</div>
        </div>
      </footer>
    </main>
  );
}