import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";
export async function POST(request: Request) {
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

    const body = await request.json();
    const orderId = body.orderId;

    if (orderId === undefined || orderId === null) {
      return NextResponse.json(
        {
          success: false,
          error: "Bestell-ID fehlt.",
        },
        { status: 400 }
      );
    }

    const { error, count } = await supabase
      .from("orders")
      .delete({ count: "exact" })
      .eq("id", orderId);

    if (error) {
      console.error("Supabase Löschfehler:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Bestellung konnte nicht gelöscht werden.",
        },
        { status: 500 }
      );
    }

    if (!count || count < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Bestellung wurde nicht gefunden oder nicht gelöscht.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Fehler beim Löschen:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Bestellung konnte nicht gelöscht werden.",
      },
      { status: 500 }
    );
  }
}