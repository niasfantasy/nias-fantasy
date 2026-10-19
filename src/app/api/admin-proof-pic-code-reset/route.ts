import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orderId = Number(body.orderId);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { error: "Ungültige Bestell-ID." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase-Zugangsdaten fehlen." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
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
        {
          error:
            "Der Code kann nur bei versendeten Bestellungen zurückgesetzt werden.",
        },
        { status: 403 }
      );
    }

    const { data: proofPic, error: proofPicError } = await supabase
      .from("order_proof_pics")
      .select("id, storage_path, access_code_hash, email_sent_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (proofPicError) {
      throw proofPicError;
    }

    if (!proofPic?.storage_path || !proofPic.access_code_hash) {
      return NextResponse.json(
        { error: "Für diese Bestellung existiert kein Freischaltcode." },
        { status: 400 }
      );
    }

    if (proofPic.email_sent_at) {
      return NextResponse.json(
        {
          error:
            "Der Code wurde bereits per E-Mail versendet und kann nicht über diese Funktion zurückgesetzt werden.",
        },
        { status: 409 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("order_proof_pics")
      .update({
        access_code_hash: null,
        code_created_at: null,
      })
      .eq("id", proofPic.id)
      .is("email_sent_at", null)
      .eq("access_code_hash", proofPic.access_code_hash)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updated) {
      return NextResponse.json(
        {
          error:
            "Der Code konnte nicht zurückgesetzt werden, weil sich die Bestellung inzwischen geändert hat.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Freischaltcode zurückgesetzt. Du kannst jetzt einen neuen Code erstellen.",
    });
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Proof-Pic-Codes:", error);

    return NextResponse.json(
      { error: "Der Freischaltcode konnte nicht zurückgesetzt werden." },
      { status: 500 }
    );
  }
}