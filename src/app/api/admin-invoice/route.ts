import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";
export async function POST(request: Request) {
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

    const { orderId } = await request.json();

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

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      console.error("Bestellung nicht gefunden:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Bestellung wurde nicht gefunden.",
        },
        { status: 404 }
      );
    }

    if (!order.invoice_number) {
      return NextResponse.json(
        {
          success: false,
          error: "Für diese Bestellung wurde noch keine Rechnungsnummer erstellt.",
        },
        { status: 400 }
      );
    }

    if (!order.invoice_pdf_path) {
  return NextResponse.json(
    {
      success: false,
      error:
        "Für diese Rechnung wurde noch keine gespeicherte PDF gefunden.",
    },
    { status: 404 }
  );
}

const {
  data: pdfFile,
  error: downloadError,
} = await supabase.storage
  .from("invoices")
  .download(order.invoice_pdf_path);

if (downloadError || !pdfFile) {
  console.error(
    "Rechnung PDF Download Fehler:",
    downloadError
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Gespeicherte Rechnung konnte nicht geladen werden.",
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
      `inline; filename="${order.invoice_number}.pdf"`,
  },
});
  } catch (error) {
    console.error("INVOICE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Rechnung konnte nicht erstellt werden.",
      },
      { status: 500 }
    );
  }
}