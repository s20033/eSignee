import { PDFDocument, type PDFFont, type PDFImage, type PDFPage, rgb } from "pdf-lib";
import { loadFonts } from "./fonts";
import { wrapText } from "./layout";
import { PAGE_WIDTH, PAGE_HEIGHT, MARGIN, CONTENT_WIDTH, COLORS, type SignatureBlockLayout } from "./chrome";

// Real handwritten signatures read as small marks, not blown-up graphics — this cap
// keeps pdf-lib's scaleToFit from stretching the certificate-page copy to fill its box.
const CERT_SIGNATURE_MAX_WIDTH = 120;
const CERT_SIGNATURE_MAX_HEIGHT = 36;

export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
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
// "Strona X z Y" footer text and the separator line above it. Sized like a small
// initials mark, not a full-size signature.
const FOOTER_MARK_MAX_WIDTH = 36;
const FOOTER_MARK_MAX_HEIGHT = 16;
const FOOTER_MARK_Y = 3;
const FOOTER_MARK_GAP = 10;
const FOOTER_MARK_SLOT_X: Record<"employee" | "employer", number> = {
  employer: PAGE_WIDTH / 2 - FOOTER_MARK_MAX_WIDTH - FOOTER_MARK_GAP / 2,
  employee: PAGE_WIDTH / 2 + FOOTER_MARK_GAP / 2,
};

type ApplySignatureMarksOptions = {
  role: "employee" | "employer";
  layout: SignatureBlockLayout | null;
  signatureDataUrl: string;
  /** Employer's own logo/stamp image URL (profiles.logoUrl) — used as the stamp next to the employer's signature. */
  stampUrl?: string | null;
};

/**
 * Stamps one party's signature onto the document: a small mark in the footer of
 * every existing page (so a page can't be silently swapped out of a signed set),
 * the full signature in the document's own signature-block placeholder, and the
 * employer's own logo/stamp next to their signature. Does NOT add a certificate
 * page — call `appendCertificatePage` once the document reaches its final signed
 * state (see `applySignatureToDocument` for the common single-signer case, which
 * does both in one call).
 */
export const applySignatureMarks = async (
  pdfBytes: Uint8Array,
  options: ApplySignatureMarksOptions,
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
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
    // Rests just above the line, like an actual signature, rather than floating
    // centered in the (now much shorter) placeholder box.
    const signatureY = rect.y + 4;
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

  return pdfDoc.save();
};

export type SignerCertEntry = {
  roleLabel: string;
  name: string;
  email: string;
  signedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  consentText: string;
  signatureImageBytes: Uint8Array;
};

export type CertificateOptions = {
  documentId: string;
  documentTitle: string;
  // Hash of the document's immediately-preceding version (documents.sha256Hash,
  // already recorded by recordDocumentVersion) — shown so a viewer can verify
  // integrity independently of the QR code. Never a hash of this call's own output.
  sha256Hash: string | null;
  // One entry per signer, rendered as one full-width card per signer, stacked —
  // so a two-party document still ends up with exactly one certificate page,
  // not two, and long fields never have to fight for half a page's width.
  signers: SignerCertEntry[];
};

// Groups a hex digest into 8-character blocks so pdf-lib's word-wrap (which can
// only break on whitespace) has somewhere to break — an unbroken 64-char hash
// would otherwise run straight off the page edge.
const formatHashForDisplay = (hash: string): string => hash.replace(/(.{8})/g, "$1 ").trim();

// A raw user-agent string is 100+ characters of noise on a document meant to be
// read, not parsed — reduce it to what a signer actually did ("Chrome · macOS").
// The full string is still kept verbatim in signatures.userAgent for the audit log.
const summarizeUserAgent = (userAgent: string): string => {
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Nieznana przeglądarka";

  const os = /Windows/.test(userAgent)
    ? "Windows"
    : /Mac OS X/.test(userAgent)
      ? "macOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;

  return os ? `${browser} · ${os}` : browser;
};

const MUTED = rgb(0.45, 0.47, 0.52);
const CARD_BORDER = rgb(0.15, 0.17, 0.22);
const DARK_BAR = rgb(0.11, 0.15, 0.23);
const DARK_BAR_TEXT = rgb(0.86, 0.89, 0.94);
const SUMMARY_FILL = rgb(0.94, 0.96, 1);
const SIGNATURE_BOX_FILL = rgb(0.98, 0.985, 0.99);

const ROW_PADDING = 17;
const RIGHT_COL_WIDTH = 150;

/** One full-width signer card: name/role, contact + technical fields, consent text, and a boxed signature — closed off by a dark info bar carrying the IP and timestamp. Returns the y just below the card, for the next one to start at. */
const drawSignerRow = (
  page: PDFPage,
  args: {
    x: number;
    width: number;
    topY: number;
    font: PDFFont;
    boldFont: PDFFont;
    signer: SignerCertEntry;
    signatureImage: PDFImage;
  },
): number => {
  const { x, width, font, boldFont, signer, signatureImage } = args;
  const leftWidth = width - RIGHT_COL_WIDTH - ROW_PADDING * 3;
  const leftX = x + ROW_PADDING;
  const rightX = leftX + leftWidth + ROW_PADDING;

  let ly = args.topY - ROW_PADDING - 11;
  page.drawText(signer.name, { x: leftX, y: ly, size: 13.5, font: boldFont, color: COLORS.black });
  ly -= 16;
  page.drawText(signer.roleLabel, { x: leftX, y: ly, size: 9.5, font, color: COLORS.darkBlue });
  ly -= 14;
  page.drawLine({ start: { x: leftX, y: ly }, end: { x: leftX + leftWidth, y: ly }, thickness: 0.5, color: COLORS.lightGray });
  ly -= 17;

  const inlineField = (label: string, value: string) => {
    page.drawText(label, { x: leftX, y: ly, size: 8, font: boldFont, color: MUTED });
    const labelWidth = boldFont.widthOfTextAtSize(`${label} `, 8);
    page.drawText(value, { x: leftX + labelWidth, y: ly, size: 9.5, font, color: COLORS.black });
    ly -= 15;
  };

  inlineField("Email:", signer.email);
  inlineField("Przeglądarka:", signer.userAgent ? summarizeUserAgent(signer.userAgent) : "—");

  // Right column: the actual drawn signature, boxed like a seal.
  page.drawText("PODPIS ELEKTRONICZNY", { x: rightX, y: args.topY - ROW_PADDING - 5, size: 6.5, font: boldFont, color: MUTED });
  const sigDims = signatureImage.scaleToFit(Math.min(CERT_SIGNATURE_MAX_WIDTH, RIGHT_COL_WIDTH - 16), CERT_SIGNATURE_MAX_HEIGHT);
  const sigBoxHeight = sigDims.height + 26;
  const sigBoxY = args.topY - ROW_PADDING - 16 - sigBoxHeight;
  page.drawRectangle({
    x: rightX,
    y: sigBoxY,
    width: RIGHT_COL_WIDTH,
    height: sigBoxHeight,
    color: SIGNATURE_BOX_FILL,
    borderColor: COLORS.lightGray,
    borderWidth: 0.75,
  });
  page.drawImage(signatureImage, {
    x: rightX + (RIGHT_COL_WIDTH - sigDims.width) / 2,
    y: sigBoxY + (sigBoxHeight - sigDims.height) / 2,
    width: sigDims.width,
    height: sigDims.height,
  });
  page.drawLine({
    start: { x: rightX - ROW_PADDING / 2, y: args.topY - 6 },
    end: { x: rightX - ROW_PADDING / 2, y: Math.min(ly, sigBoxY) },
    thickness: 0.5,
    color: COLORS.lightGray,
  });

  // Consent text runs the full card width beneath both columns, not squeezed
  // into the left column alone — the single biggest lever for keeping a
  // two-signer certificate on one page.
  let fy = Math.min(ly, sigBoxY) - 15;
  page.drawText("PODSTAWA PRAWNA I ZGODA", { x: leftX, y: fy, size: 7, font: boldFont, color: MUTED });
  fy -= 12;
  for (const line of wrapText(signer.consentText, font, 8.5, width - ROW_PADDING * 2)) {
    page.drawText(line, { x: leftX, y: fy, size: 8.5, font, color: rgb(0.35, 0.35, 0.4) });
    fy -= 11.5;
  }

  const barY = fy - 14;
  const BAR_HEIGHT = 21;
  page.drawRectangle({ x, y: barY, width, height: BAR_HEIGHT, color: DARK_BAR });
  page.drawText(`Adres IP: ${signer.ipAddress ?? "—"}`, {
    x: x + ROW_PADDING,
    y: barY + 6.5,
    size: 8,
    font,
    color: DARK_BAR_TEXT,
  });
  const timestamp = signer.signedAt.toLocaleString("pl-PL", { dateStyle: "long", timeStyle: "medium" });
  const timestampWidth = font.widthOfTextAtSize(timestamp, 8);
  page.drawText(timestamp, {
    x: x + width - ROW_PADDING - timestampWidth,
    y: barY + 6.5,
    size: 8,
    font,
    color: DARK_BAR_TEXT,
  });

  // Un-filled border wraps the whole card (including the dark bar), drawn last
  // so the stroke sits cleanly on top without hiding anything beneath it.
  page.drawRectangle({
    x,
    y: barY,
    width,
    height: args.topY - barY,
    borderColor: CARD_BORDER,
    borderWidth: 1,
  });

  return barY;
};

/**
 * Appends exactly one certificate page with the legal audit trail (signer(s),
 * timestamp, IP, consent text, document hash) for a document's final signed
 * state. Call this once per document lifecycle — for two-party documents that
 * means only on the second (completing) signature, with both signers passed in
 * together, not once per signing step.
 */
export const appendCertificatePage = async (
  pdfBytes: Uint8Array,
  options: CertificateOptions,
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const { regular: font, bold: boldFont } = await loadFonts(pdfDoc);
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
  // A plain accent band across the top of the frame — the one flourish that
  // reads "this is a certificate, not just another page" at a glance.
  certPage.drawRectangle({
    x: FRAME_X,
    y: FRAME_Y + FRAME_HEIGHT - 5,
    width: FRAME_WIDTH,
    height: 5,
    color: COLORS.darkBlue,
  });

  let y = PAGE_HEIGHT - 78;

  certPage.drawText("CERTYFIKAT PODPISU ELEKTRONICZNEGO", { x: MARGIN, y, size: 17, font: boldFont, color: COLORS.darkBlue });
  y -= 15;
  certPage.drawText("Poświadczenie złożenia podpisu elektronicznego · Electronic Signature Certificate", {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: MUTED,
  });
  y -= 13;
  certPage.drawText(`ID dokumentu: ${options.documentId}`, { x: MARGIN, y, size: 7.5, font, color: MUTED });
  y -= 14;
  certPage.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.75, color: COLORS.lightGray });
  y -= 20;

  // Document summary card — title + integrity hash, framed the same way as the
  // signer cards below so the whole certificate reads as one connected system.
  const summaryPadding = 13;
  const partiesLabel = options.signers.length === 2 ? "obie strony" : "podpisującego";
  const summaryLines = wrapText(
    `Dokument „${options.documentTitle}” został podpisany elektronicznie przez ${partiesLabel} i zabezpieczony sumą kontrolną poniżej — każda zmiana treści dokumentu zmienia tę sumę.`,
    font,
    9.5,
    CONTENT_WIDTH - summaryPadding * 2 - 4,
  );
  const hashDisplay = options.sha256Hash ? formatHashForDisplay(options.sha256Hash) : null;
  const summaryHeight = summaryPadding * 2 + summaryLines.length * 13 + (hashDisplay ? 23 : 0);
  const summaryY = y - summaryHeight;

  certPage.drawRectangle({
    x: MARGIN,
    y: summaryY,
    width: CONTENT_WIDTH,
    height: summaryHeight,
    color: SUMMARY_FILL,
    borderColor: COLORS.darkBlue,
    borderWidth: 0.75,
  });
  certPage.drawRectangle({ x: MARGIN, y: summaryY, width: 3, height: summaryHeight, color: COLORS.darkBlue });

  let sy = y - summaryPadding - 8;
  for (const line of summaryLines) {
    certPage.drawText(line, { x: MARGIN + summaryPadding + 4, y: sy, size: 9.5, font, color: rgb(0.13, 0.16, 0.22) });
    sy -= 13;
  }
  if (hashDisplay) {
    sy -= 1;
    certPage.drawText("SUMA KONTROLNA DOKUMENTU (SHA-256)", { x: MARGIN + summaryPadding + 4, y: sy, size: 6.5, font: boldFont, color: MUTED });
    sy -= 11;
    certPage.drawText(hashDisplay, { x: MARGIN + summaryPadding + 4, y: sy, size: 8, font, color: rgb(0.13, 0.16, 0.22) });
  }

  y = summaryY - 22;

  for (const signer of options.signers) {
    const signatureImage = await pdfDoc.embedPng(signer.signatureImageBytes);
    y = drawSignerRow(certPage, { x: MARGIN, width: CONTENT_WIDTH, topY: y, font, boldFont, signer, signatureImage });
    y -= 18;
  }

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

export type ApplySignatureOptions = ApplySignatureMarksOptions & {
  documentId: string;
  signerLabel: string;
  signerName: string;
  signerEmail: string;
  consentText: string;
  signedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  documentTitle: string;
  sha256Hash: string | null;
};

/**
 * Applies one party's signature and its certificate page in a single call — the
 * common path for single-signer documents ("employee"-only or "employer"-only).
 * Two-party documents instead call `applySignatureMarks` on the first signature
 * and `appendCertificatePage` (with both signers) on the second, so they end up
 * with one shared certificate page rather than one per signer.
 */
export const applySignatureToDocument = async (
  pdfBytes: Uint8Array,
  options: ApplySignatureOptions,
): Promise<Uint8Array> => {
  const marked = await applySignatureMarks(pdfBytes, options);
  return appendCertificatePage(marked, {
    documentId: options.documentId,
    documentTitle: options.documentTitle,
    sha256Hash: options.sha256Hash,
    signers: [
      {
        roleLabel: options.signerLabel,
        name: options.signerName,
        email: options.signerEmail,
        signedAt: options.signedAt,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        consentText: options.consentText,
        signatureImageBytes: dataUrlToBytes(options.signatureDataUrl),
      },
    ],
  });
};
