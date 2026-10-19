import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey || !resendKey) {
      return NextResponse.json(
        { error: "Server-Konfiguration unvollständig." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const orderId = Number(body.orderId);
    const accessCode = String(body.accessCode || "").trim();

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0 ||
      !/^NF-(?:[A-HJ-NP-Z2-9]{4}-){2}[A-HJ-NP-Z2-9]{4}$/.test(
        accessCode
      )
    ) {
      return NextResponse.json(
        { error: "Ungültige Bestell-ID oder ungültiger Code." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, email, order_number, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Bestellung nicht gefunden." },
        { status: 404 }
      );
    }

    if (order.status !== "versendet") {
      return NextResponse.json(
        { error: "Die Bestellung muss versendet sein." },
        { status: 403 }
      );
    }

    const { data: proofPic, error: proofError } = await supabase
      .from("order_proof_pics")
      .select("storage_path, access_code_hash, email_sent_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (proofError || !proofPic?.storage_path || !proofPic.access_code_hash) {
      return NextResponse.json(
        { error: "Proof-Pic oder Freischaltcode fehlt." },
        { status: 400 }
      );
    }

    if (proofPic.email_sent_at) {
      return NextResponse.json(
        { error: "Die Benachrichtigung wurde bereits versendet." },
        { status: 409 }
      );
    }

    const suppliedHash = createHash("sha256")
      .update(accessCode)
      .digest();

    const storedHash = Buffer.from(
      proofPic.access_code_hash,
      "hex"
    );

    if (
      storedHash.length !== suppliedHash.length ||
      !timingSafeEqual(storedHash, suppliedHash)
    ) {
      return NextResponse.json(
        { error: "Der Code gehört nicht zu dieser Bestellung." },
        { status: 400 }
      );
    }

    const proofPicLink =
      "https://niasfantasy.com/proof-pic";

    const resend = new Resend(resendKey);

    const { error: emailError } = await resend.emails.send({
      from: "Nia's Fantasy <office@niasfantasy.com>",
      to: order.email,
      subject: `Dein Proof-Pic – Bestellung ${order.order_number}`,
      text: [
        "Dein persönliches Proof-Pic wurde vorbereitet.",
        "",
        `Bestellnummer: ${order.order_number}`,
        `Link: ${proofPicLink}`,
        `Dein persönlicher Code: ${accessCode}`,
        "",
        "Wichtiger Hinweis:",
        "Der Zugriff auf explizite Proof-Pics wird erst",
        "nach erfolgreicher Altersverifikation freigeschaltet.",
        "Der Code allein ermöglicht derzeit keinen Bildzugriff.",
        "",
        "Nia's Fantasy",
      ].join("\n"),
    });

    if (emailError) {
      console.error("Resend-Fehler:", emailError);
      return NextResponse.json(
        { error: "Die E-Mail konnte nicht versendet werden." },
        { status: 502 }
      );
    }

    const { error: updateError } = await supabase
      .from("order_proof_pics")
      .update({
        email_sent_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .is("email_sent_at", null);

    if (updateError) {
      console.error("E-Mail-Status konnte nicht gespeichert werden:", updateError);

      return NextResponse.json(
        {
          error:
            "E-Mail wurde versendet, aber der Versandstatus konnte nicht gespeichert werden. Bitte nicht erneut senden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Proof-Pic-Benachrichtigung wurde versendet.",
    });
  } catch (error) {
    console.error("Proof-Pic-E-Mail-Fehler:", error);

    return NextResponse.json(
      { error: "E-Mail konnte nicht verarbeitet werden." },
      { status: 500 }
    );
  }
}