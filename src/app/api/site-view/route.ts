import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
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

    const { data, error } = await supabase.rpc(
      "increment_site_view",
      {
        page_name: "home",
      }
    );

    if (error) {
      console.error("Fehler beim Zählen des Seitenaufrufs:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Seitenaufruf konnte nicht gezählt werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      views: data,
    });
  } catch (error) {
    console.error("Site-View Fehler:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Interner Serverfehler.",
      },
      { status: 500 }
    );
  }
}