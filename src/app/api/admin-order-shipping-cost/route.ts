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
    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase-Zugangsdaten fehlen.",
        },
        { status: 500 }
      );
    }

    const { orderId, shippingCost } =
      await request.json();

    const amount =
      shippingCost === "" || shippingCost === null
        ? null
        : Number(shippingCost);

    if (
      amount !== null &&
      (Number.isNaN(amount) || amount < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Ungültige Versandkosten.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { error } = await supabase
      .from("orders")
      .update({
  actual_shipping_cost: amount,
  actual_shipping_cost_date:
    amount === null
      ? null
      : new Date().toISOString().slice(0, 10),
})
      .eq("id", orderId);

    if (error) {
      console.error(
        "Versandkosten Fehler:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Versandkosten konnten nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "SHIPPING COST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Versandkosten konnten nicht gespeichert werden.",
      },
      { status: 500 }
    );
  }
}
