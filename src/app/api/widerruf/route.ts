import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !supabaseSecretKey) {
  return NextResponse.json(
    { success: false, error: "Supabase-Zugangsdaten fehlen." },
    { status: 500 }
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);
if (!resendApiKey) {
      return NextResponse.json(
        { success: false, error: "E-Mail-Konfiguration fehlt." },
        { status: 500 }
      );
    }

    const body = await request.json();

   const orderNumber = String(body.orderNumber || "").trim();
const name = String(body.name || "").trim();
const email = String(body.email || "").trim();
const scope = String(body.scope || "").trim();
const products = String(body.products || "").trim();
const reason = String(body.reason || "").trim();

    if (!orderNumber || !name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Bitte alle Pflichtfelder ausfüllen.",
        },
        { status: 400 }
      );
    }
const { data: order, error: orderError } = await supabase
  .from("orders")
  .select("id, order_number, email")
  .eq("order_number", orderNumber)
  .eq("email", email)
  .maybeSingle();

if (orderError) {
  console.error("Fehler bei Bestellprüfung:", orderError);

  return NextResponse.json(
    {
      success: false,
      error: "Die Bestellung konnte nicht geprüft werden.",
    },
    { status: 500 }
  );
}

if (!order) {
  return NextResponse.json(
    {
      success: false,
      error:
        "Bestellnummer und E-Mail-Adresse konnten keiner Bestellung zugeordnet werden.",
    },
    { status: 400 }
  );
}
    const resend = new Resend(resendApiKey);
const receivedAt = new Date();

const receivedDateTime = receivedAt.toLocaleString("de-AT", {
  timeZone: "Europe/Vienna",
  dateStyle: "medium",
  timeStyle: "medium",
});
    const { error } = await resend.emails.send({
      from: "Nia's Fantasy <office@niasfantasy.com>",
      to: ["nias.fantasy@outlook.com"],
      replyTo: email,
      subject: `Widerruf – Bestellung ${orderNumber}`,
      html: `
        <h2>Neue Widerrufserklärung</h2>

        <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Umfang:</strong> ${
  scope === "partial"
    ? "Teilwiderruf"
    : "Gesamte Bestellung"
}</p>
<p><strong>Produkte:</strong> ${
  products || "Keine einzelnen Produkte angegeben"
}</p>
        <p><strong>Grund:</strong> ${reason || "Kein Grund angegeben"}</p>

        <p>
          Der Kunde hat über die Website eine Widerrufserklärung
          übermittelt.
        </p>
      `,
    });

    if (error) {
      console.error("Widerruf E-Mail Fehler:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Widerruf konnte nicht übermittelt werden.",
        },
        { status: 500 }
      );
    }
const { error: confirmationError } = await resend.emails.send({
  from: "Nia's Fantasy <office@niasfantasy.com>",
  to: [email],
  subject: `Bestätigung deines Widerrufs – Bestellung ${orderNumber}`,
  html: `
    <h2>Bestätigung deiner Widerrufserklärung</h2>

    <p>
      Wir bestätigen den Eingang deiner Widerrufserklärung.
    </p>

    <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>E-Mail:</strong> ${email}</p>
    <p><strong>Umfang:</strong> ${
  scope === "partial"
    ? "Teilwiderruf"
    : "Gesamte Bestellung"
}</p>

<p><strong>Produkte:</strong> ${
  products || "Keine einzelnen Produkte angegeben"
}</p>
    <p><strong>Grund:</strong> ${reason || "Kein Grund angegeben"}</p>
    <p><strong>Eingang:</strong> ${receivedDateTime}</p>

    <p>
      Diese Bestätigung dokumentiert lediglich den Eingang deiner
      Erklärung. Ob im konkreten Fall ein gesetzliches
      Rücktrittsrecht besteht, wird gesondert geprüft.
    </p>
  `,
});

if (confirmationError) {
  console.error(
    "Widerruf Bestätigungsmail Fehler:",
    confirmationError
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Widerruf wurde übermittelt, aber die Bestätigungsmail konnte nicht gesendet werden.",
    },
    { status: 500 }
  );
}
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Widerruf Fehler:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Widerruf konnte nicht übermittelt werden.",
      },
      { status: 500 }
    );
  }
}