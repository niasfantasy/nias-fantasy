"use client";

import { useState } from "react";

export default function ProofPicPage() {
  const [accessCode, setAccessCode] = useState("");
const [proofPicUrl, setProofPicUrl] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

const unlockProofPic = async () => {
  setIsLoading(true);
  setErrorMessage("");
  setProofPicUrl(null);

  try {
    const response = await fetch("/api/proof-pic-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessCode,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const result = await response.json();
      setErrorMessage(
        result.error || "Das Bild konnte nicht freigeschaltet werden."
      );
      return;
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    setProofPicUrl(imageUrl);
  } catch (error) {
    console.error("Fehler beim Abrufen des Proof-Pics:", error);
    setErrorMessage("Beim Abrufen des Bildes ist ein Fehler aufgetreten.");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070503] px-6 py-16 text-white">
      <div className="w-full max-w-lg rounded-[2rem] border border-[#C8A96B]/30 bg-white/[0.04] p-8 text-center shadow-2xl md:p-12">
        <div className="mb-6 flex justify-center">
  <img
    src="/nias-fantasy-logo.png"
    alt="Nia's Fantasy Logo"
    className="h-20 w-auto object-contain md:h-24"
  />
</div>

        <h1 className="text-3xl font-semibold md:text-4xl">
          Dein persönliches Proof-Pic
        </h1>

        <p className="mt-5 text-sm leading-relaxed text-white/60">
          Dein persönliches Proof-Pic ist ausschließlich für dich
          bestimmt. Für den Zugriff sind eine bestätigte
          Volljährigkeit und dein individueller Freischaltcode
          erforderlich.
        </p>

        <div className="mt-8 text-left">
          <label
            htmlFor="accessCode"
            className="mb-2 block text-sm font-medium text-white/80"
          >
            Persönlicher Freischaltcode
          </label>

          <input
            id="accessCode"
            type="text"
            value={accessCode}
            onChange={(e) =>
              setAccessCode(e.target.value.toUpperCase())
            }
            placeholder="NF-XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-white/20 bg-black px-4 py-4 text-center font-mono text-lg tracking-wider text-white outline-none focus:border-[#C8A96B]"
          />
        </div>

        <button
  type="button"
  onClick={unlockProofPic}
  disabled={isLoading || !accessCode.trim()}
  className={`mt-6 w-full rounded-xl px-6 py-4 font-semibold transition ${
    isLoading || !accessCode.trim()
      ? "cursor-not-allowed bg-[#C8A96B]/40 text-black/60"
      : "bg-[#C8A96B] text-black hover:bg-[#E2D1A2]"
  }`}
>
  {isLoading ? "Wird geprüft..." : "Proof-Pic freischalten"}
</button>

{errorMessage && (
  <p className="mt-4 text-sm text-red-400">
    {errorMessage}
  </p>
)}

{proofPicUrl && (
  <div className="mt-8">
    <p className="mb-4 text-sm font-medium text-[#C8A96B]">
      Dein persönliches Bild
    </p>

    <img
      src={proofPicUrl}
      alt="Persönliches Testbild zur Bestellung"
      className="mx-auto max-h-[70vh] w-auto max-w-full rounded-2xl border border-white/10 object-contain"
    />

    <a
      href={proofPicUrl}
      download="Nias-Fantasy-Proof-Pic"
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8A96B] px-8 py-3 font-semibold text-black transition hover:bg-[#E2D1A2]"
    >
      <span>↓</span>
      Bild herunterladen
    </a>
  </div>
)}


        <p className="mt-4 text-xs leading-relaxed text-white/40">
          Die Freischaltung wird nach Einrichtung der sicheren
          Altersverifikation aktiviert. Der Freischaltcode allein
          ermöglicht noch keinen Bildzugriff.
        </p>

        <a
          href="/"
          className="mt-8 inline-block text-sm text-white/50 transition hover:text-[#C8A96B]"
        >
          ← Zurück zur Startseite
        </a>
      </div>
    </main>
  );
}