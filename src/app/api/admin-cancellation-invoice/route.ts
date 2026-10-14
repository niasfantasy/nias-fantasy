import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Nicht autorisiert.",
        },
        { status: 401 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Supabase-Zugangsdaten fehlen.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { orderId } =
      await request.json();

    const {
      data: order,
      error,
    } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bestellung wurde nicht gefunden.",
        },
        { status: 404 }
      );
    }

    if (
      !order.cancellation_invoice_number
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Für diese Bestellung gibt es keine Stornorechnung.",
        },
        { status: 400 }
      );
    }

    if (!order.cancellation_invoice_pdf_path) {
  return NextResponse.json(
    {
      success: false,
      error:
        "Für diese Stornorechnung wurde noch keine gespeicherte PDF gefunden.",
    },
    { status: 404 }
  );
}

const {
  data: pdfFile,
  error: downloadError,
} = await supabase.storage
  .from("invoices")
  .download(
    order.cancellation_invoice_pdf_path
  );

if (downloadError || !pdfFile) {
  console.error(
    "Stornorechnung PDF Download Fehler:",
    downloadError
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Gespeicherte Stornorechnung konnte nicht geladen werden.",
    },
    { status: 500 }
  );
}

const pdfBytes =
  await pdfFile.arrayBuffer();

return new Response(pdfBytes, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition":
      `inline; filename="${order.cancellation_invoice_number}.pdf"`,
  },
});
  } catch (error) {
    console.error(
      "STORNORECHNUNG PDF ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Stornorechnung konnte nicht geöffnet werden.",
      },
      { status: 500 }
    );
  }
}