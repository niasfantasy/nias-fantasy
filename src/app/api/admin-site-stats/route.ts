import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Nicht autorisiert.",
        },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase-Zugangsdaten fehlen.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { data, error } = await supabase
      .from("site_stats")
      .select("views")
      .eq("page", "home")
      .single();

    if (error) {
      console.error("Fehler beim Laden der Seitenaufrufe:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Seitenaufrufe konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      views: Number(data?.views || 0),
    });
  } catch (error) {
    console.error("Admin Site Stats Fehler:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Interner Serverfehler.",
      },
      { status: 500 }
    );
  }
}