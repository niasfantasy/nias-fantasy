import fs from "fs";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

export async function createInvoicePdf(order: any) {
  const productNames: Record<string, string> = {
    dose05: "Dose 0,5 l",
    dose025: "Dose 0,25 l",
    kugelschreiber: "Kugelschreiber",
    pet05: "PET-Flasche 0,5 l",
    pet1: "PET-Flasche 1 l",
    pet15: "PET-Flasche 1,5 l",
  };

  const productPrices: Record<string, number> = {
    dose05: 199,
    dose025: 149,
    kugelschreiber: 99,
    pet05: 169,
    pet1: 249,
    pet15: 299,
  };

  const countryNames: Record<string, string> = {
    AT: "Österreich",
    DE: "Deutschland",
    CH: "Schweiz",
  };

  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([
    595.28,
    841.89,
  ]);

  const regularFont = await pdfDoc.embedFont(
    StandardFonts.Helvetica
  );

  const boldFont = await pdfDoc.embedFont(
    StandardFonts.HelveticaBold
  );

  const gold = rgb(
    200 / 255,
    169 / 255,
    107 / 255
  );

  const dark = rgb(
    18 / 255,
    14 / 255,
    10 / 255
  );

  const gray = rgb(
    90 / 255,
    90 / 255,
    90 / 255
  );

  // Kopfbereich
  page.drawRectangle({
    x: 0,
    y: 735,
    width: 595.28,
    height: 106.89,
    color: dark,
  });

  // Logo
  const logoPath = path.join(
    process.cwd(),
    "public",
    "nias-fantasy-logo.png"
  );

  const logoBytes =
    fs.readFileSync(logoPath);

  const logoImage =
    await pdfDoc.embedPng(logoBytes);

  const logoScaled =
    logoImage.scale(0.12);

  page.drawImage(logoImage, {
    x: 50,
    y: 745,
    width: logoScaled.width,
    height: logoScaled.height,
  });

  page.drawText("RECHNUNG", {
    x: 455,
    y: 760,
    size: 13,
    font: regularFont,
    color: rgb(1, 1, 1),
  });

  // Verkäuferdaten
  const businessName =
    process.env.BUSINESS_NAME ||
    "Nia's Fantasy TEST";

  const businessAddress =
    process.env.BUSINESS_ADDRESS ||
    "Teststraße 1";

  const businessZip =
    process.env.BUSINESS_ZIP ||
    "0000";

  const businessCity =
    process.env.BUSINESS_CITY ||
    "Testort";

  page.drawText(businessName, {
    x: 50,
    y: 700,
    size: 10,
    font: boldFont,
  });

  page.drawText(businessAddress, {
    x: 50,
    y: 685,
    size: 10,
    font: regularFont,
  });

  page.drawText(
    `${businessZip} ${businessCity}`,
    {
      x: 50,
      y: 670,
      size: 10,
      font: regularFont,
    }
  );

  page.drawText("Österreich", {
    x: 50,
    y: 655,
    size: 10,
    font: regularFont,
  });

  // Rechnungsdaten
  const invoiceDate =
    order.invoice_date
      ? new Date(
          order.invoice_date
        ).toLocaleDateString("de-AT")
      : new Date().toLocaleDateString(
          "de-AT"
        );

  const paidDate =
    order.paid_at
      ? new Date(
          order.paid_at
        ).toLocaleDateString("de-AT")
      : "-";

  page.drawText(
    "Rechnungsnummer:",
    {
      x: 345,
      y: 700,
      size: 10,
      font: regularFont,
      color: gray,
    }
  );

  page.drawText(
    order.invoice_number,
    {
      x: 455,
      y: 700,
      size: 10,
      font: boldFont,
    }
  );

  page.drawText(
    "Rechnungsdatum:",
    {
      x: 345,
      y: 683,
      size: 10,
      font: regularFont,
      color: gray,
    }
  );

  page.drawText(invoiceDate, {
    x: 455,
    y: 683,
    size: 10,
    font: regularFont,
  });

  page.drawText(
    "Zahlung erhalten:",
    {
      x: 345,
      y: 666,
      size: 10,
      font: regularFont,
      color: gray,
    }
  );

  page.drawText(paidDate, {
    x: 455,
    y: 666,
    size: 10,
    font: regularFont,
  });

  // Kunde
  page.drawText("Rechnung an", {
    x: 50,
    y: 610,
    size: 11,
    font: boldFont,
    color: gold,
  });

  page.drawText(
    order.name || "",
    {
      x: 50,
      y: 588,
      size: 10,
      font: boldFont,
    }
  );

  page.drawText(
    order.adresse || "",
    {
      x: 50,
      y: 573,
      size: 10,
      font: regularFont,
    }
  );

  page.drawText(
    `${order.plz || ""} ${
      order.ort || ""
    }`,
    {
      x: 50,
      y: 558,
      size: 10,
      font: regularFont,
    }
  );

  page.drawText(
    countryNames[order.land] ||
      order.land ||
      "",
    {
      x: 50,
      y: 543,
      size: 10,
      font: regularFont,
    }
  );

  // Tabellenkopf
  let y = 485;

  page.drawRectangle({
    x: 50,
    y,
    width: 495,
    height: 30,
    color: dark,
  });

  page.drawText("Produkt", {
    x: 60,
    y: y + 10,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText("Menge", {
    x: 330,
    y: y + 10,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText("Betrag", {
    x: 450,
    y: y + 10,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  y -= 25;

  for (const [
    product,
    quantityValue,
  ] of Object.entries(
    order.quantities || {}
  )) {
    const quantity =
      Number(quantityValue);

    if (quantity <= 0) {
      continue;
    }

    const productName =
      productNames[product] ||
      product;

    const unitPrice =
      productPrices[product] || 0;

    const lineTotal =
      unitPrice * quantity;

    page.drawText(productName, {
      x: 60,
      y,
      size: 10,
      font: regularFont,
    });

    page.drawText(
      String(quantity),
      {
        x: 345,
        y,
        size: 10,
        font: regularFont,
      }
    );

    page.drawText(
      `${lineTotal.toFixed(
        2
      )} EUR`,
      {
        x: 450,
        y,
        size: 10,
        font: regularFont,
      }
    );

    y -= 28;
  }

  // Versand
  page.drawText("Versand", {
    x: 60,
    y,
    size: 10,
    font: regularFont,
  });

  page.drawText(
    `${Number(
      order.shipping_costs || 0
    ).toFixed(2)} EUR`,
    {
      x: 450,
      y,
      size: 10,
      font: regularFont,
    }
  );

  y -= 35;

  page.drawLine({
    start: { x: 330, y },
    end: { x: 545, y },
    thickness: 1,
    color: gold,
  });

  y -= 25;

  page.drawText(
    "Gesamtbetrag",
    {
      x: 330,
      y,
      size: 12,
      font: boldFont,
    }
  );

  page.drawText(
    `${Number(
      order.total_price || 0
    ).toFixed(2)} EUR`,
    {
      x: 450,
      y,
      size: 12,
      font: boldFont,
      color: gold,
    }
  );

  // Kleinunternehmer
  page.drawText(
    "Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung.",
    {
      x: 50,
      y: 160,
      size: 9,
      font: regularFont,
      color: gray,
    }
  );

  page.drawText(
    `Bestellnummer: ${
      order.order_number || "-"
    }`,
    {
      x: 50,
      y: 135,
      size: 9,
      font: regularFont,
      color: gray,
    }
  );

  page.drawText(
    "Vielen Dank für deine Bestellung bei Nia's Fantasy.",
    {
      x: 50,
      y: 90,
      size: 10,
      font: regularFont,
    }
  );

  return await pdfDoc.save();
}