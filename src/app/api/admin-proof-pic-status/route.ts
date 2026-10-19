import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        { error: "Nicht autorisiert." },
        { status: 401 }
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

    const { data, error } = await supabase
      .from("order_proof_pics")
     .select("order_id, storage_path, access_code_hash, email_sent_at, test_access_enabled");

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
     proofPics: (data || []).map((item) => ({
  orderId: item.order_id,
  uploaded: Boolean(item.storage_path),
  codeCreated: Boolean(item.access_code_hash),
  emailSent: Boolean(item.email_sent_at),
  testAccessEnabled: item.test_access_enabled === true,
})),
    });
  } catch (error) {
    console.error("Proof-Pic-Status konnte nicht geladen werden:", error);

    return NextResponse.json(
      { error: "Proof-Pic-Status konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}