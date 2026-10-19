import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    const body = await request.json();
    const orderId = Number(body.orderId);
    const enabled = body.enabled;

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0 ||
      typeof enabled !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Ungültige Eingaben." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase-Konfiguration fehlt." },
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

    if (enabled && order.status !== "versendet") {
      return NextResponse.json(
        {
          error:
            "Testzugriff kann erst bei versendeten Bestellungen aktiviert werden.",
        },
        { status: 403 }
      );
    }

    const { data: proofPic, error: proofError } = await supabase
      .from("order_proof_pics")
      .select("id, storage_path")
      .eq("order_id", orderId)
      .maybeSingle();

    if (proofError || !proofPic?.storage_path) {
      return NextResponse.json(
        { error: "Für diese Bestellung ist kein Bild vorhanden." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("order_proof_pics")
      .update({ test_access_enabled: enabled })
      .eq("id", proofPic.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      testAccessEnabled: enabled,
    });
  } catch (error) {
    console.error("Fehler bei der Testfreigabe:", error);

    return NextResponse.json(
      { error: "Testfreigabe konnte nicht geändert werden." },
      { status: 500 }
    );
  }
}