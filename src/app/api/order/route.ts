import { Resend } from "resend";
console.log("SUPABASE_URL raw:", JSON.stringify(process.env.SUPABASE_URL));
console.log("SUPABASE_URL length:", process.env.SUPABASE_URL?.length);
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const bankAccountHolder = process.env.BANK_ACCOUNT_HOLDER;
const bankIban = process.env.BANK_IBAN;
const bankBic = process.env.BANK_BIC;
if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Supabase-Zugangsdaten fehlen");

  return NextResponse.json(
    {
      success: false,
      error: "Supabase-Zugangsdaten wurden nicht gefunden.",
    },
    { status: 500 }
  );
}
const supabase = createClient(supabaseUrl, supabaseSecretKey);

    if (!apiKey) {
      console.error("RESEND_API_KEY fehlt");

      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY wurde nicht gefunden.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const data = await request.json();
    const productPrices: Record<string, number> = {
  dose05: 19900,
  dose025: 14900,
  kugelschreiber: 9900,
  pet05: 16900,
  pet1: 24900,
  pet15: 29900,
};

const shippingPrices: Record<string, number> = {
  AT: 795,
  DE: 1495,
  CH: 1495,
};
    const orderNumber = `${new Date().getFullYear()}-${crypto
  .randomUUID()
  .slice(0, 8)
  .toUpperCase()}`;

    const {
  name,
  email,
  paymentMethod,
  land,
  adresse,
  plz,
  ort,
  personalisierung,
  nachricht,
  quantities,
} = data;
const subtotalCents = Object.entries(quantities).reduce(
  (sum, [key, quantity]) => {
    const price = productPrices[key];

    if (price === undefined) {
      throw new Error(`Unbekanntes Produkt: ${key}`);
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 0) {
      throw new Error(`Ungültige Menge für ${key}`);
    }

    return sum + price * qty;
  },
  0
);

const shippingCents = shippingPrices[land];

if (shippingCents === undefined) {
  throw new Error(`Ungültiges Lieferland: ${land}`);
}

const totalCents = subtotalCents + shippingCents;

const subtotal = (subtotalCents / 100).toFixed(2);
const shippingCosts = (shippingCents / 100).toFixed(2);
const totalPrice = (totalCents / 100).toFixed(2);
    console.log("SUPABASE URL:", JSON.stringify(supabaseUrl));
console.log("SUPABASE TABLE: orders");
    const { error: supabaseError } = await supabase
  .from("orders")
  .insert([
    {
        order_number: orderNumber,
      name,
      email,
      payment_method: paymentMethod,
      land,
      adresse,
      plz,
      ort,
      personalisierung,
      nachricht,
      quantities,
      subtotal,
      shipping_costs: shippingCosts,
      total_price: totalPrice,
      status: "neu",
    },
  ]);

if (supabaseError) {
  console.error("Supabase Fehler:", supabaseError);

  return NextResponse.json(
  {
    success: false,
    error: supabaseError.message,
    details: supabaseError.details,
    hint: supabaseError.hint,
    code: supabaseError.code,
  },
  { status: 500 }
);
}
    const countryNames: Record<string, string> = {
  AT: "Österreich",
  DE: "Deutschland",
  CH: "Schweiz",
};

const countryName = countryNames[land] || land;
const productNames: Record<string, string> = {
  dose05: "Dose 0,5 l",
  dose025: "Dose 0,25 l",
  kugelschreiber: "Kugelschreiber",
  pet05: "PET-Flasche 0,5 l",
  pet1: "PET-Flasche 1 l",
  pet15: "PET-Flasche 1,5 l",
};


const selectedProducts = Object.entries(quantities)
  .filter(([, quantity]) => Number(quantity) > 0)
  .map(
  ([key, quantity]) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #2d271f;color:#ffffff;">
        ${productNames[key] || key}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #2d271f;color:#c8a96b;text-align:right;font-weight:600;">
        ${quantity}×
      </td>
    </tr>
  `
)
  .join("");
    const { data: emailData, error } = await resend.emails.send({
      from: "Nia's Fantasy <office@niasfantasy.com>",

      // HIER deine Gmail-Adresse eintragen
      to: ["onboarding@resend.dev"],

      subject: `Neue Bestellung ${orderNumber} – ${name}`,

      html: `
      <div style="background:#0b0907;padding:24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
       <div style="max-width:600px;margin:0 auto;background:#120e0a;border:1px solid #3b3021;border-radius:20px;padding:28px;">
      <div style="text-align:center;margin-bottom:28px;">

  <div style="color:#c8a96b;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">
    NIA'S FANTASY
  </div>

  <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.3;">
    Neue Bestellung
  </h1>

</div>

        <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

  <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
    Kundendaten
  </h2>

  <p><strong>Name:</strong> ${name}</p>
  <p><strong>E-Mail:</strong> ${email}</p>
  <p><strong>Land:</strong> ${countryName}</p>
  <p><strong>Adresse:</strong> ${adresse}</p>
  <p><strong>PLZ / Ort:</strong> ${plz} ${ort}</p>

</div>

        <hr />

       <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

  <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
    Personalisierung
  </h2>

  <p style="margin:0;color:#ffffff;">
    ${personalisierung || "Keine Personalisierung angegeben"}
  </p>

</div>

        <hr />

       <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

  <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
    Produkte
  </h2>

  <table width="100%" cellspacing="0" cellpadding="0">
    ${selectedProducts}
  </table>

</div>
        <hr />

      <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

  <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
    Bestellsumme
  </h2>

  <p style="margin:8px 0;color:#cfc8bf;">
    Warenwert:
    <span style="float:right;color:#ffffff;">
      ${subtotal} €
    </span>
  </p>

  <p style="margin:8px 0;color:#cfc8bf;">
    Versand:
    <span style="float:right;color:#ffffff;">
      ${shippingCosts} €
    </span>
  </p>

  <p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #3b3021;font-size:20px;font-weight:bold;">
    Gesamt:
    <span style="float:right;color:#c8a96b;">
      ${totalPrice} €
    </span>
  </p>

</div>

        <hr />

        <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

  <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
    Anmerkung
  </h2>

  <p style="margin:0;color:#cfc8bf;line-height:1.6;">
    ${nachricht || "Keine Anmerkung"}
  </p>

</div>
     </div>
     </div>
        `,
    });

   if (error) {
  console.error("Fehler bei interner Bestellmail:", error);
} else {
  console.log("Interne Bestellmail erfolgreich gesendet:", emailData);
}


   const { error: customerEmailError } = await resend.emails.send({
  from: "Nia's Fantasy <office@niasfantasy.com>",
  to: [email],
  subject: `Bestellbestätigung ${orderNumber} – Nia's Fantasy`,
  html: `
    <div style="background:#0b0907;padding:24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">

      <div style="max-width:600px;margin:0 auto;background:#120e0a;border:1px solid #3b3021;border-radius:20px;padding:28px;">

        <div style="text-align:center;margin-bottom:28px;">
          <div style="color:#c8a96b;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">
            NIA'S FANTASY
          </div>

          <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.3;">
            Vielen Dank für deine Bestellung!
          </h1>
        </div>

        <p style="font-size:18px;">
          Hallo ${name},
        </p>

        <p style="color:#cfc8bf;line-height:1.6;">
  wir haben deine Bestellung erfolgreich erhalten.
</p>

<p style="color:#cfc8bf;line-height:1.6;">
  Deine Bestellung wird nun bearbeitet. Sobald sie versendet wurde,
  erhältst du eine weitere E-Mail mit den Versandinformationen.
</p>

<div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">
  <div style="color:#c8a96b;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">
    Bestellnummer
  </div>

  <div style="font-size:22px;font-weight:bold;color:#ffffff;">
    ${orderNumber}
  </div>
</div>


        <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

          <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
            Deine Bestellung
          </h2>

          <table width="100%" cellspacing="0" cellpadding="0">
            ${selectedProducts}
          </table>

        </div>

        <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

          <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
            Personalisierung
          </h2>

          <p style="margin:0;color:#ffffff;">
            ${personalisierung || "Keine Personalisierung angegeben"}
          </p>

        </div>

        <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

          <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
            Bestellsumme
          </h2>

          <p style="margin:8px 0;color:#cfc8bf;">
            Warenwert:
            <span style="float:right;color:#ffffff;">
              ${subtotal} €
            </span>
          </p>

          <p style="margin:8px 0;color:#cfc8bf;">
            Versand:
            <span style="float:right;color:#ffffff;">
              ${shippingCosts} €
            </span>
          </p>

          <p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #3b3021;font-size:20px;font-weight:bold;">
            Gesamt:
            <span style="float:right;color:#c8a96b;">
              ${totalPrice} €
            </span>
          </p>

        </div>
<div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

  <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
    Zahlung per Vorkasse
  </h2>

  <p style="margin:0 0 12px;color:#cfc8bf;line-height:1.6;">
    Bitte überweise den Gesamtbetrag auf folgendes Konto:
  </p>

  <p style="margin:6px 0;color:#ffffff;">
    <strong>Kontoinhaber:</strong> ${bankAccountHolder}
  </p>

  <p style="margin:6px 0;color:#ffffff;">
    <strong>IBAN:</strong> ${bankIban}
  </p>

  <p style="margin:6px 0;color:#ffffff;">
    <strong>BIC:</strong> ${bankBic}
  </p>

  <p style="margin:6px 0;color:#ffffff;">
    <strong>Betrag:</strong> ${totalPrice} €
  </p>

  <p style="margin:6px 0;color:#ffffff;">
    <strong>Verwendungszweck:</strong> ${orderNumber}
  </p>

  <p style="margin:16px 0 0;color:#cfc8bf;line-height:1.6;">
    Deine Bestellung wird nach Zahlungseingang weiter bearbeitet.
  </p>

</div>
        <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">

          <h2 style="margin:0 0 16px;color:#c8a96b;font-size:20px;">
            Lieferadresse
          </h2>

          <p style="margin:0;line-height:1.7;">
            ${name}<br />
            ${adresse}<br />
            ${plz} ${ort}<br />
            ${countryName}
          </p>

        </div>

        <p style="margin-top:30px;color:#cfc8bf;line-height:1.6;">
          Kuss und viel Spaß ;)<br />
          <strong style="color:#c8a96b;">NIA</strong>
        </p>

      </div>

    </div>
  `,
});

if (customerEmailError) {
  console.error(
    "KUNDEN-BESTÄTIGUNG KONNTE NICHT GESENDET WERDEN:",
    customerEmailError
  );
}
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ORDER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler bei der Bestellung.",
      },
      { status: 500 }
    );
  }
}