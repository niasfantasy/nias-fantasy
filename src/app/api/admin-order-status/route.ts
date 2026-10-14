import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { createInvoicePdf } from "@/lib/createInvoicePdf";
import { createCancellationInvoicePdf } from "@/lib/createCancellationInvoicePdf";
import { isAdminAuthenticated } from "@/lib/adminAuth";
export const runtime = "nodejs";

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
    const resendApiKey = process.env.RESEND_API_KEY;

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

    const { orderId, status } = await request.json();

   const allowedStatus = [
  "neu",
  "bezahlt",
  "versendet",
  "storniert",
];

    if (!allowedStatus.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Ungültiger Status.",
        },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } =
      await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
      console.error(
        "Bestellung nicht gefunden:",
        orderError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Bestellung wurde nicht gefunden.",
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
    };

    let invoiceNumber =
      order.invoice_number;
if (
  status === "storniert" &&
  order.invoice_number
) {
  if (!order.cancellation_invoice_number) {
    const {
      data: generatedCancellationNumber,
      error: cancellationNumberError,
    } = await supabase.rpc(
      "generate_cancellation_invoice_number"
    );

    if (
      cancellationNumberError ||
      !generatedCancellationNumber
    ) {
      console.error(
        "Fehler bei Stornonummer:",
        cancellationNumberError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Stornonummer konnte nicht erstellt werden.",
        },
        { status: 500 }
      );
    }

    updateData.cancellation_invoice_number =
      generatedCancellationNumber;

    updateData.cancellation_invoice_date =
      new Date().toISOString();
  }
}
    if (status === "bezahlt") {
      const now = new Date().toISOString();

      if (!invoiceNumber) {
        const {
          data: generatedInvoiceNumber,
          error: invoiceNumberError,
        } = await supabase.rpc(
          "generate_invoice_number"
        );

        if (
          invoiceNumberError ||
          !generatedInvoiceNumber
        ) {
          console.error(
            "Fehler bei Rechnungsnummer:",
            invoiceNumberError
          );

          return NextResponse.json(
            {
              success: false,
              error:
                "Rechnungsnummer konnte nicht erstellt werden.",
            },
            { status: 500 }
          );
        }

        invoiceNumber =
          generatedInvoiceNumber;

        updateData.invoice_number =
          invoiceNumber;
      }

      if (!order.paid_at) {
        updateData.paid_at = now;
      }

      if (!order.invoice_date) {
        updateData.invoice_date = now;
      }
    }

    const {
      data: updatedOrder,
      error: updateError,
    } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError || !updatedOrder) {
      console.error(
        "Supabase Fehler:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Status konnte nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    // Rechnung nur beim Status "bezahlt"
// und nur einmal versenden
if (
  status === "bezahlt" &&
  !updatedOrder.invoice_sent
) {
  if (!resendApiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_API_KEY fehlt.",
      },
      { status: 500 }
    );
  }

  const pdfBytes =
    await createInvoicePdf(
      updatedOrder
    );
    const invoicePdfPath =
  `${updatedOrder.invoice_number}.pdf`;

const {
  error: invoiceUploadError,
} = await supabase.storage
  .from("invoices")
  .upload(
    invoicePdfPath,
    Buffer.from(pdfBytes),
    {
      contentType: "application/pdf",
      upsert: false,
    }
  );

if (
  invoiceUploadError &&
  !invoiceUploadError.message.includes(
    "already exists"
  )
) {
  console.error(
    "Rechnung PDF Upload Fehler:",
    invoiceUploadError
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Rechnung wurde erstellt, konnte aber nicht gespeichert werden.",
    },
    { status: 500 }
  );
}

const {
  error: invoicePathError,
} = await supabase
  .from("orders")
  .update({
    invoice_pdf_path:
      invoicePdfPath,
  })
  .eq("id", orderId);

if (invoicePathError) {
  console.error(
    "invoice_pdf_path konnte nicht gespeichert werden:",
    invoicePathError
  );
}

  const resend = new Resend(
    resendApiKey
  );

  const { error: emailError } =
    await resend.emails.send({
      from: "Nia's Fantasy <office@niasfantasy.com>",
      to: [updatedOrder.email],
      subject: `Rechnung ${updatedOrder.invoice_number} – Nia's Fantasy`,
      html: `
        <div style="background:#0b0907;padding:24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#120e0a;border:1px solid #3b3021;border-radius:20px;padding:28px;">

            <div style="color:#c8a96b;font-size:13px;letter-spacing:3px;text-transform:uppercase;">
              NIA'S FANTASY
            </div>

            <h1 style="color:#ffffff;">
              Deine Rechnung
            </h1>

            <p style="color:#cfc8bf;line-height:1.6;">
              Hallo ${updatedOrder.name},
            </p>

            <p style="color:#cfc8bf;line-height:1.6;">
              vielen Dank für deine Zahlung.
              Im Anhang findest du deine Rechnung
              ${updatedOrder.invoice_number}.
            </p>

            <p style="color:#cfc8bf;line-height:1.6;">
              Deine Bestellung wird nun weiter bearbeitet.
            </p>

            <p style="margin-top:30px;color:#cfc8bf;">
              Kuss und viel Spaß ;)<br />
              <strong style="color:#c8a96b;">NIA</strong>
            </p>

          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${updatedOrder.invoice_number}.pdf`,
          content: Buffer.from(
            pdfBytes
          ),
        },
      ],
    });

  if (emailError) {
    console.error(
      "Rechnungsmail Fehler:",
      emailError
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Status wurde gespeichert, aber die Rechnung konnte nicht per E-Mail versendet werden.",
      },
      { status: 500 }
    );
  }

  const {
    error: invoiceSentError,
  } = await supabase
    .from("orders")
    .update({
      invoice_sent: true,
    })
    .eq("id", orderId);

  if (invoiceSentError) {
    console.error(
      "invoice_sent konnte nicht gespeichert werden:",
      invoiceSentError
    );
  }
}

// Stornorechnung nur bei fakturierter Bestellung
// und nur einmal versenden
if (
  status === "storniert" &&
  updatedOrder.invoice_number &&
  updatedOrder.cancellation_invoice_number &&
  !updatedOrder.cancellation_invoice_sent
) {
  if (!resendApiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_API_KEY fehlt.",
      },
      { status: 500 }
    );
  }

  const pdfBytes =
    await createCancellationInvoicePdf(
      updatedOrder
    );
const cancellationInvoicePdfPath =
  `${updatedOrder.cancellation_invoice_number}.pdf`;

const {
  error: cancellationInvoiceUploadError,
} = await supabase.storage
  .from("invoices")
  .upload(
    cancellationInvoicePdfPath,
    Buffer.from(pdfBytes),
    {
      contentType: "application/pdf",
      upsert: false,
    }
  );

if (
  cancellationInvoiceUploadError &&
  !cancellationInvoiceUploadError.message.includes(
    "already exists"
  )
) {
  console.error(
    "Stornorechnung PDF Upload Fehler:",
    cancellationInvoiceUploadError
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Stornorechnung wurde erstellt, konnte aber nicht gespeichert werden.",
    },
    { status: 500 }
  );
}

const {
  error: cancellationInvoicePathError,
} = await supabase
  .from("orders")
  .update({
    cancellation_invoice_pdf_path:
      cancellationInvoicePdfPath,
  })
  .eq("id", orderId);

if (cancellationInvoicePathError) {
  console.error(
    "cancellation_invoice_pdf_path konnte nicht gespeichert werden:",
    cancellationInvoicePathError
  );
}
  const resend = new Resend(
    resendApiKey
  );

  const { error: emailError } =
    await resend.emails.send({
      from: "Nia's Fantasy <office@niasfantasy.com>",
      to: [updatedOrder.email],
      subject: `Stornorechnung ${updatedOrder.cancellation_invoice_number} – Nia's Fantasy`,
      html: `
        <div style="background:#0b0907;padding:24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#120e0a;border:1px solid #3b3021;border-radius:20px;padding:28px;">

            <div style="color:#c8a96b;font-size:13px;letter-spacing:3px;text-transform:uppercase;">
              NIA'S FANTASY
            </div>

            <h1 style="color:#ffffff;">
              Deine Stornorechnung
            </h1>

            <p style="color:#cfc8bf;line-height:1.6;">
              Hallo ${updatedOrder.name},
            </p>

            <p style="color:#cfc8bf;line-height:1.6;">
              deine Bestellung wurde storniert.
              Im Anhang findest du die Stornorechnung
              ${updatedOrder.cancellation_invoice_number}.
            </p>

            <p style="color:#cfc8bf;line-height:1.6;">
              Die Stornorechnung bezieht sich auf die ursprüngliche Rechnung
              ${updatedOrder.invoice_number}.
            </p>

            <p style="margin-top:30px;color:#cfc8bf;">
              Liebe Grüße<br />
              <strong style="color:#c8a96b;">NIA</strong>
            </p>

          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${updatedOrder.cancellation_invoice_number}.pdf`,
          content: Buffer.from(
            pdfBytes
          ),
        },
      ],
    });

  if (emailError) {
    console.error(
      "Stornorechnungsmail Fehler:",
      emailError
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Bestellung wurde storniert, aber die Stornorechnung konnte nicht per E-Mail versendet werden.",
      },
      { status: 500 }
    );
  }

  const {
    error: cancellationSentError,
  } = await supabase
    .from("orders")
    .update({
      cancellation_invoice_sent: true,
    })
    .eq("id", orderId);

  if (cancellationSentError) {
    console.error(
      "cancellation_invoice_sent konnte nicht gespeichert werden:",
      cancellationSentError
    );
  }
}
    return NextResponse.json({
      success: true,
      invoiceNumber:
        updatedOrder.invoice_number,
    });
  } catch (error) {
    console.error(
      "STATUS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Status konnte nicht geändert werden.",
      },
      { status: 500 }
    );
  }
}