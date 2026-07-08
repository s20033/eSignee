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
  let y = PAGE_HEIGHT - 80;

  certPage.drawText("Potwierdzenie podpisu elektronicznego", {
    x: MARGIN,
    y,
    size: 14,
    font: boldFont,
    color: COLORS.darkBlue,
  });
  y -= 30;

  certPage.drawText(`${options.signerLabel}: ${options.signerName}`, { x: MARGIN, y, size: 10, font });
  y -= 18;

  certPage.drawText(`Data i godzina podpisu: ${options.signedAt.toLocaleString("pl-PL")}`, {
    x: MARGIN,
    y,
    size: 10,
    font,
  });
  y -= 18;

  if (options.ipAddress) {
    certPage.drawText(`Adres IP: ${options.ipAddress}`, { x: MARGIN, y, size: 10, font });
    y -= 18;
  }

  y -= 10;
  for (const line of wrapText(options.consentText, font, 9, CONTENT_WIDTH)) {
    certPage.drawText(line, { x: MARGIN, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 13;
  }
  y -= 17;

  const certDims = signatureImage.scaleToFit(220, 90);
  certPage.drawImage(signatureImage, {
    x: MARGIN,
    y: y - certDims.height,
    width: certDims.width,
    height: certDims.height,
  });

  return pdfDoc.save();
};
