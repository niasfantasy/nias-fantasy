import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

function generateAccessCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);

  let code = "NF-";

  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += "-";
    }

    code += characters[bytes[i] % characters.length];
  }

  return code;
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();
    const parsedOrderId = Number(orderId);

    if (!Number.isSafeInteger(parsedOrderId) || parsedOrderId <= 0) {
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
      .eq("id", parsedOrderId)
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
            "Der Freischaltcode kann erst erstellt werden, wenn die Bestellung versendet wurde.",
        },
        { status: 403 }
      );
    }

    const { data: proofPic, error: proofPicError } = await supabase
      .from("order_proof_pics")
      .select("id, storage_path, access_code_hash, email_sent_at")
      .eq("order_id", parsedOrderId)
      .maybeSingle();

    if (proofPicError) {
      throw proofPicError;
    }

    if (!proofPic?.storage_path) {
      return NextResponse.json(
        { error: "Bitte zuerst ein Proof-Pic hochladen." },
        { status: 400 }
      );
    }

    if (proofPic.access_code_hash) {
      return NextResponse.json(
        {
          error:
            "Für diese Bestellung wurde bereits ein Freischaltcode erstellt.",
        },
        { status: 409 }
      );
    }

    const accessCode = generateAccessCode();

    const accessCodeHash = createHash("sha256")
      .update(accessCode)
      .digest("hex");

    const { data: updated, error: updateError } = await supabase
      .from("order_proof_pics")
      .update({
        access_code_hash: accessCodeHash,
        code_created_at: new Date().toISOString(),
      })
      .eq("id", proofPic.id)
      .is("access_code_hash", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Der Freischaltcode wurde inzwischen bereits erstellt." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      accessCode,
      message: "Freischaltcode erfolgreich erstellt.",
    });
  } catch (error) {
    console.error("Fehler bei der Proof-Pic-Codegenerierung:", error);

    return NextResponse.json(
      { error: "Der Freischaltcode konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}