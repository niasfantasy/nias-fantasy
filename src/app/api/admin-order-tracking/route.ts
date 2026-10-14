import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
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

    const { orderId, trackingCode } =
      await request.json();

    const cleanTrackingCode =
      String(trackingCode || "").trim();

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

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_code: cleanTrackingCode,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error(
        "Supabase Fehler:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Tracking-Code konnte nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    if (
      cleanTrackingCode &&
      !order.shipping_email_sent
    ) {
      if (!resendApiKey) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Tracking-Code wurde gespeichert, aber RESEND_API_KEY fehlt.",
          },
          { status: 500 }
        );
      }

      const resend = new Resend(resendApiKey);

      const { error: emailError } =
        await resend.emails.send({
          from: "Nia's Fantasy <office@niasfantasy.com>",
          to: [order.email],
          subject: `Deine Bestellung ${order.order_number} wurde versendet – Nia's Fantasy`,
          html: `
            <div style="background:#0b0907;padding:24px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
              <div style="max-width:600px;margin:0 auto;background:#120e0a;border:1px solid #3b3021;border-radius:20px;padding:28px;">

                <div style="color:#c8a96b;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">
                  NIA'S FANTASY
                </div>

                <h1 style="margin:0 0 24px;color:#ffffff;font-size:28px;">
                  Deine Bestellung wurde versendet
                </h1>

                <p style="color:#cfc8bf;line-height:1.6;">
                  Hallo ${order.name},
                </p>

                <p style="color:#cfc8bf;line-height:1.6;">
  deine Bestellung ist auf dem Weg zu dir und wurde mit der Österreichischen Post versendet.
</p>

                <div style="margin:24px 0;padding:20px;background:#0b0907;border:1px solid #3b3021;border-radius:16px;">
                  <div style="color:#c8a96b;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">
                    Tracking-Code
                  </div>

                  <div style="font-size:20px;font-weight:bold;color:#ffffff;">
                    ${cleanTrackingCode}
                  </div>
                </div>

                <p style="color:#cfc8bf;line-height:1.6;">
  Mit diesem Tracking-Code kannst du den Versandstatus bei der Österreichischen Post verfolgen.
</p>
<div style="margin:24px 0;">
  <a
    href="https://www.post.at/s/sendungssuche"
    target="_blank"
    style="display:inline-block;background:#c8a96b;color:#000000;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:999px;"
  >
    Sendung verfolgen
  </a>
</div>

                <p style="margin-top:30px;color:#cfc8bf;line-height:1.6;">
                  Kuss und viel Spaß ;)<br />
                  <strong style="color:#c8a96b;">NIA</strong>
                </p>

              </div>
            </div>
          `,
        });

      if (emailError) {
        console.error(
          "Versandmail Fehler:",
          emailError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Tracking-Code wurde gespeichert, aber die Versandbestätigung konnte nicht gesendet werden.",
          },
          { status: 500 }
        );
      }

      const { error: sentUpdateError } =
        await supabase
          .from("orders")
          .update({
            shipping_email_sent: true,
            status: "versendet",
          })
          .eq("id", orderId);

      if (sentUpdateError) {
        console.error(
          "Versandstatus konnte nicht gespeichert werden:",
          sentUpdateError
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "TRACKING ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Tracking-Code konnte nicht geändert werden.",
      },
      { status: 500 }
    );
  }
}