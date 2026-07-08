import { PDFDocument, type PDFImage, rgb } from "pdf-lib";
import { loadFonts } from "./fonts";
import { wrapText } from "./layout";
import { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, CONTENT_WIDTH, COLORS, type SignatureBlockLayout } from "./chrome";

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
};

/** Fetches an employer-provided image URL (e.g. profiles.logoUrl) and embeds it, trying PNG then JPEG. Returns null on any failure so a bad/unreachable URL never breaks signing. */
const embedImageFromUrl = async (pdfDoc: PDFDocument, url: string): Promise<PDFImage | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      return await pdfDoc.embedJpg(bytes);
    }
  } catch {
    return null;
  }
};

// Footer-row marks, centered at the bottom of every page, clear of the "Wygenerowano" /
// "Strona X z Y" footer text and the separator line above it.
const FOOTER_MARK_MAX_WIDTH = 50;
const FOOTER_MARK_MAX_HEIGHT = 35;
const FOOTER_MARK_Y = 3;
const FOOTER_MARK_GAP = 10;
const FOOTER_MARK_SLOT_X: Record<"employee" | "employer", number> = {
  employer: PAGE_WIDTH / 2 - FOOTER_MARK_MAX_WIDTH - FOOTER_MARK_GAP / 2,
  employee: PAGE_WIDTH / 2 + FOOTER_MARK_GAP / 2,
};

type ApplySignatureOptions = {
  role: "employee" | "employer";
  layout: SignatureBlockLayout | null;
  signerLabel: string;
  signerName: string;
  signatureDataUrl: string;
  consentText: string;
  signedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  documentTitle: string;
  /** Employer's own logo/stamp image URL (profiles.logoUrl) — used as the stamp next to the employer's signature. */
  stampUrl?: string | null;
};

/**
 * Applies one party's signature to a document: a small mark in the footer of every
 * existing page (so a page can't be silently swapped out of a signed set), the full
 * signature in the document's own signature-block placeholder, the employer's own
 * logo/stamp next to their signature, and a certificate page with the legal audit
 * trail (signer, timestamp, IP, consent text) — kept alongside the inline placement.
 */
export const applySignatureToDocument = async (
  pdfBytes: Uint8Array,
  options: ApplySignatureOptions,
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const { regular: font, bold: boldFont } = await loadFonts(pdfDoc);
  const signatureImage = await pdfDoc.embedPng(dataUrlToBytes(options.signatureDataUrl));

  const markDims = signatureImage.scaleToFit(FOOTER_MARK_MAX_WIDTH, FOOTER_MARK_MAX_HEIGHT);
  const slotX = FOOTER_MARK_SLOT_X[options.role];
  const markX = slotX + (FOOTER_MARK_MAX_WIDTH - markDims.width) / 2;
  const markY = FOOTER_MARK_Y + (FOOTER_MARK_MAX_HEIGHT - markDims.height) / 2;
  for (const page of pdfDoc.getPages()) {
    page.drawImage(signatureImage, { x: markX, y: markY, width: markDims.width, height: markDims.height });
  }

  const rect = options.role === "employer" ? options.layout?.employer : options.layout?.employee;
  if (rect && options.layout) {
    const page = pdfDoc.getPage(options.layout.pageIndex);
    const dims = signatureImage.scaleToFit(rect.maxWidth, rect.maxHeight);
    const signatureX = rect.x + (rect.maxWidth - dims.width) / 2;
    const signatureY = rect.y + (rect.maxHeight - dims.height) / 2;
    page.drawImage(signatureImage, { x: signatureX, y: signatureY, width: dims.width, height: dims.height });

    if (options.role === "employer" && options.layout.employer && options.stampUrl) {
      const stampImage = await embedImageFromUrl(pdfDoc, options.stampUrl);
      if (stampImage) {
        const { stamp } = options.layout.employer;
        const stampDims = stampImage.scaleToFit(stamp.size, stamp.size);
        page.drawImage(stampImage, { x: stamp.x, y: stamp.y, width: stampDims.width, height: stampDims.height });
      }
    }
  }

  const certPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const FRAME_X = MARGIN - 15;
  const FRAME_Y = 50;
  const FRAME_WIDTH = CONTENT_WIDTH + 30;
  const FRAME_HEIGHT = PAGE_HEIGHT - 100;
  certPage.drawRectangle({
    x: FRAME_X,
    y: FRAME_Y,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
  });

  let y = PAGE_HEIGHT - 75;

  certPage.drawText("CERTYFIKAT PODPISU ELEKTRONICZNEGO", {
    x: MARGIN,
    y,
    size: 15,
    font: boldFont,
    color: COLORS.darkBlue,
  });
  y -= 15;
  certPage.drawText("Electronic Signature Certificate", { x: MARGIN, y, size: 8, font, color: COLORS.gray });
  y -= 12;
  certPage.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.75, color: COLORS.lightGray });
  y -= 24;

  const sectionHeader = (label: string) => {
    certPage.drawText(label, { x: MARGIN, y, size: 10, font: boldFont, color: COLORS.darkBlue });
    y -= 16;
  };

  const field = (label: string, value: string) => {
    certPage.drawText(label, { x: MARGIN, y, size: 9, font: boldFont, color: COLORS.black });
    const labelWidth = boldFont.widthOfTextAtSize(`${label} `, 9);
    for (const line of wrapText(value, font, 9, CONTENT_WIDTH - labelWidth)) {
      certPage.drawText(line, { x: MARGIN + labelWidth, y, size: 9, font, color: COLORS.black });
      y -= 13;
    }
  };

  sectionHeader("Dokument / Document");
  field("Tytuł:", options.documentTitle);
  y -= 8;

  sectionHeader("Osoba podpisująca / Signatory");
  field("Imię i nazwisko:", options.signerName);
  field("Rola:", options.signerLabel);
  y -= 8;

  sectionHeader("Dane techniczne podpisu / Signature technical data");
  field("Data i godzina:", `${options.signedAt.toLocaleString("pl-PL", { dateStyle: "long", timeStyle: "medium" })} (czas lokalny)`);
  if (options.ipAddress) {
    field("Adres IP:", options.ipAddress);
  }
  if (options.userAgent) {
    field("Przeglądarka:", options.userAgent);
  }
  y -= 8;

  sectionHeader("Podstawa prawna i zgoda / Legal basis & consent");
  for (const line of wrapText(options.consentText, font, 9, CONTENT_WIDTH)) {
    certPage.drawText(line, { x: MARGIN, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 13;
  }
  y -= 12;

  certPage.drawText("Podpis / Signature:", { x: MARGIN, y, size: 9, font: boldFont, color: COLORS.black });
  y -= 10;

  const certDims = signatureImage.scaleToFit(220, 80);
  certPage.drawRectangle({
    x: MARGIN,
    y: y - certDims.height - 8,
    width: certDims.width + 16,
    height: certDims.height + 16,
    borderColor: COLORS.lightGray,
    borderWidth: 0.75,
  });
  certPage.drawImage(signatureImage, {
    x: MARGIN + 8,
    y: y - certDims.height,
    width: certDims.width,
    height: certDims.height,
  });

  // Pinned near the bottom of the frame (not immediately following the content above),
  // so the certificate reads like a fixed template regardless of how long the fields above are.
  // Wrapped narrower than the full content width to leave the bottom-right verification QR
  // (embedded separately, after this function runs — see embed-verification-qr.ts) clear.
  const DISCLAIMER_WIDTH = CONTENT_WIDTH - 100;
  const disclaimer =
    "Niniejszy certyfikat potwierdza złożenie prostego podpisu elektronicznego w rozumieniu art. 3 pkt 10 rozporządzenia eIDAS (UE nr 910/2014). Dane osobowe przetwarzane są zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).";
  const disclaimerLines = wrapText(disclaimer, font, 7, DISCLAIMER_WIDTH);
  let footerY = FRAME_Y + 16 + disclaimerLines.length * 10;
  for (const line of disclaimerLines) {
    footerY -= 10;
    certPage.drawText(line, { x: MARGIN, y: footerY, size: 7, font, color: COLORS.gray });
  }

  return pdfDoc.save();
};
