"use client";

import { useState } from "react";

export default function Widerruf() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"success" | "error" | "">("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setStatus("");

    const form = e.currentTarget;
    const formData = new FormData(form);

  const payload = {
  orderNumber: formData.get("orderNumber"),
  name: formData.get("name"),
  email: formData.get("email"),
  scope: formData.get("scope"),
  products: formData.get("products"),
  reason: formData.get("reason"),
};

    try {
      const response = await fetch("/api/widerruf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Widerruf konnte nicht übermittelt werden."
        );
      }

      setStatus("success");
      setMessage(
        "Deine Widerrufserklärung wurde erfolgreich übermittelt."
      );

      form.reset();
    } catch (error) {
      console.error(error);

      setStatus("error");
      setMessage(
        "Beim Übermitteln der Widerrufserklärung ist ein Fehler aufgetreten."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070503] text-white">
      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#C8A96B]">
            <img
  src="/nias-fantasy-logo.png"
  alt="Nia's Fantasy"
  className="-ml-2 h-auto w-[220px] md:-ml-3 md:w-[280px]"
/>
          </p>

          <h1 className="mb-8 text-4xl font-semibold md:text-5xl">
            Vertrag widerrufen
          </h1>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-10">
            <p className="leading-relaxed text-white/70">
              Hier kannst du eine Erklärung zum Widerruf eines
              online abgeschlossenen Vertrags übermitteln.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Bitte beachte: Bei individuell nach Kundenspezifikation
              angefertigten Waren kann das gesetzliche Rücktrittsrecht
              ausgeschlossen sein. Deine Erklärung wird dennoch geprüft.
            </p>

            <form
              onSubmit={handleSubmit}
              onInput={(e) => {
  const form = e.currentTarget;
  const formData = new FormData(form);

  const ready =
    Boolean(formData.get("orderNumber")) &&
    Boolean(formData.get("name")) &&
    Boolean(formData.get("email")) &&
    Boolean(formData.get("scope"));

  setFormReady(ready);
}}
              className="mt-8 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Bestellnummer
                </label>

                <input
                  type="text"
                  name="orderNumber"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
                />
              </div>

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
              <div>
  <label className="mb-2 block text-sm text-white/70">
    Umfang des Widerrufs
  </label>

  <select
    name="scope"
    required
    defaultValue="complete"
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none focus:border-[#C8A96B]"
  >
    <option value="complete">
      Gesamte Bestellung widerrufen
    </option>

    <option value="partial">
      Nur einzelne Produkte widerrufen
    </option>
  </select>
</div>

<div>
  <label className="mb-2 block text-sm text-white/70">
    Welche Produkte sollen widerrufen werden?
  </label>

  <textarea
    name="products"
    rows={3}
    placeholder="Nur bei Teilwiderruf ausfüllen, z. B. 1× Bodyspray"
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-[#C8A96B]"
  />
</div>
              <div>
  <label className="mb-2 block text-sm text-white/70">
  Grund für den Widerruf (freiwillig)
</label>

  <textarea
    name="reason"
    rows={5}
    placeholder="Bitte beschreibe kurz, warum du widerrufen möchtest."
    className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-[#C8A96B]"
  />
</div>

              <button
                type="submit"
                disabled={isSubmitting || !formReady}
                className={`w-full rounded-full px-8 py-4 text-lg font-semibold transition ${
  isSubmitting || !formReady
    ? "cursor-not-allowed bg-white/10 text-white/30"
    : "bg-[#C8A96B] text-black hover:bg-[#E2D1A2]"
}`}
              >
               {isSubmitting
  ? "Widerruf wird übermittelt..."
  : "Widerruf bestätigen"}
  </button>

              {message && (
                <div
                  className={`rounded-2xl border px-5 py-4 text-center ${
                    status === "success"
                      ? "border-green-400/20 bg-green-400/10 text-green-300"
                      : "border-red-400/20 bg-red-400/10 text-red-300"
                  }`}
                >
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}