
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
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

    const formData = await request.formData();

    const file = formData.get("file");
    const orderIdValue = formData.get("orderId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Bitte eine Bilddatei auswählen." },
        { status: 400 }
      );
    }

    const orderId = Number(orderIdValue);

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0
    ) {
      return NextResponse.json(
        { error: "Ungültige Bestell-ID." },
        { status: 400 }
      );
    }

    if (
      file.size === 0 ||
      file.size > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        { error: "Das Bild muss zwischen 1 Byte und 10 MB groß sein." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return NextResponse.json(
        { error: "Nur JPG, PNG und WebP sind erlaubt." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Zusätzlich zum MIME-Typ die Dateisignatur prüfen.
    const isJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;

    const isPng =
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every(
        (value, index) => bytes[index] === value
      );

    const isWebp =
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

    const validSignature =
      (extension === "jpg" && isJpeg) ||
      (extension === "png" && isPng) ||
      (extension === "webp" && isWebp);

    if (!validSignature) {
      return NextResponse.json(
        { error: "Die Datei ist kein gültiges unterstütztes Bild." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

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

 if (order.status !== "versendet") {
  return NextResponse.json(
    {
      error:
        "Ein Proof-Pic kann erst hochgeladen werden, wenn die Bestellung den Status 'Versendet' hat.",
    },
    { status: 403 }
  );
}

    // Bestehende Zuordnung prüfen, damit kein bereits
    // freigegebenes Proof-Pic versehentlich überschrieben wird.
    const { data: existing, error: existingError } = await supabase
      .from("order_proof_pics")
      .select("id, storage_path, email_sent_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.storage_path) {
      return NextResponse.json(
        {
          error:
            "Für diese Bestellung existiert bereits ein Proof-Pic. Ein Austausch wird später separat eingerichtet.",
        },
        { status: 409 }
      );
    }

    const storagePath = `${orderId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("proof-pics")
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
        cacheControl: "0",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: saveError } = await supabase
      .from("order_proof_pics")
      .upsert(
        {
          order_id: orderId,
          storage_path: storagePath,
        },
        { onConflict: "order_id" }
      );

    if (saveError) {
      // Hochgeladene Datei entfernen, falls die
      // Datenbankzuordnung nicht gespeichert werden konnte.
      await supabase.storage
        .from("proof-pics")
        .remove([storagePath]);

      throw saveError;
    }

    return NextResponse.json({
      success: true,
      message: "Proof-Pic wurde privat gespeichert.",
    });
  } catch (error) {
    console.error("Proof-Pic-Upload fehlgeschlagen:", error);

    return NextResponse.json(
      { error: "Das Proof-Pic konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
