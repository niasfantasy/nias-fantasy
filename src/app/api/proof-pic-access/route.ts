import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
function getRateLimitIdentifier(request: Request): string {
  const secret = process.env.PROOF_PIC_RATE_LIMIT_SECRET;

  if (!secret) {
    throw new Error("Rate-Limit-Schlüssel fehlt.");
  }

  // Auf Netlify wird diese Adresse über den Proxy bereitgestellt.
  // Andere, möglicherweise manipulierbare IP-Header verwenden wir nicht.
  const ipAddress = request.headers.get(
  "x-nf-client-connection-ip"
);
if (process.env.PROOF_PIC_IP_DIAGNOSTIC === "true") {
  console.log(
    "Proof-Pic IP-Header vorhanden:",
    Boolean(ipAddress)
  );
}

  if (!ipAddress) {
    // Falls keine vertrauenswürdige IP verfügbar ist,
    // verwenden wir einen gemeinsamen Schutzbereich.
    return createHmac("sha256", secret)
      .update("unknown-client")
      .digest("hex");
  }

  return createHmac("sha256", secret)
    .update(ipAddress)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessCode = String(body.accessCode || "")
      .trim()
      .toUpperCase();

    // Nur Codes im vorgesehenen Format akzeptieren.
    

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server-Konfiguration fehlt." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
// Rate-Limit vor der eigentlichen Codeprüfung durchführen.
const identifierHash = getRateLimitIdentifier(request);

const { data: allowed, error: rateLimitError } = await supabase.rpc(
  "check_proof_pic_rate_limit",
  {
    p_identifier_hash: identifierHash,
  }
);

if (rateLimitError) {
  console.error("Rate-Limit-Prüfung fehlgeschlagen:", rateLimitError);

  return NextResponse.json(
    { error: "Die Sicherheitsprüfung ist momentan nicht verfügbar." },
    { status: 503 }
  );
}

if (allowed !== true) {
  return NextResponse.json(
    {
      error:
        "Zu viele Versuche. Bitte warte 15 Minuten und versuche es erneut.",
    },
    { status: 429 }
  );
}
// Nur Codes im vorgesehenen Format akzeptieren.
if (
  !/^NF-(?:[A-HJ-NP-Z2-9]{4}-){2}[A-HJ-NP-Z2-9]{4}$/.test(
    accessCode
  )
) {
  return NextResponse.json(
    { error: "Ungültiger Freischaltcode." },
    { status: 400 }
  );
}
    const suppliedHash = createHash("sha256")
      .update(accessCode)
      .digest("hex");

    // Es werden nur ausdrücklich freigegebene Testbilder berücksichtigt.
    const { data: proofPic, error: proofError } = await supabase
      .from("order_proof_pics")
      .select("order_id, storage_path, access_code_hash")
      .eq("access_code_hash", suppliedHash)
    
      .maybeSingle();

    if (proofError) {
      throw proofError;
    }

    if (!proofPic?.storage_path || !proofPic.access_code_hash) {
      return NextResponse.json(
        { error: "Code ungültig oder Testzugriff nicht freigegeben." },
        { status: 403 }
      );
    }

    const expectedHash = Buffer.from(
      proofPic.access_code_hash,
      "hex"
    );

    const actualHash = Buffer.from(suppliedHash, "hex");

    if (
      expectedHash.length !== actualHash.length ||
      !timingSafeEqual(expectedHash, actualHash)
    ) {
      return NextResponse.json(
        { error: "Ungültiger Freischaltcode." },
        { status: 403 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", proofPic.order_id)
      .maybeSingle();

    if (orderError || order?.status !== "versendet") {
      return NextResponse.json(
        { error: "Das Bild ist nicht freigegeben." },
        { status: 403 }
      );
    }

    const { data: imageData, error: imageError } =
      await supabase.storage
        .from("proof-pics")
        .download(proofPic.storage_path);

    if (imageError || !imageData) {
      throw imageError || new Error("Bild nicht gefunden.");
    }

    // Das Bild wird nur als Antwort auf eine gültige
    // Codeprüfung ausgeliefert, nicht über eine öffentliche URL.
    const imageBuffer = await imageData.arrayBuffer();

    const extension = proofPic.storage_path
      .split(".")
      .pop()
      ?.toLowerCase();

    const contentType =
      extension === "png"
        ? "image/png"
        : extension === "webp"
        ? "image/webp"
        : "image/jpeg";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("Proof-Pic-Zugriff fehlgeschlagen:", error);

    return NextResponse.json(
      { error: "Das Bild konnte nicht abgerufen werden." },
      { status: 500 }
    );
  }
}