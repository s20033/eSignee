import { PDFDocument } from "pdf-lib";
import { wrapText } from "./layout";
import { loadFonts } from "./fonts";
import { MARGIN, CONTENT_WIDTH, COLORS, createCursor, drawFooter, drawSignatureBlock, type SignatureBlockLayout } from "./chrome";
import { disclaimerNote } from "@/lib/documents/helpers";
import type { EmployerData, GeneratedDocument } from "@/lib/documents/types";

const BODY_SIZE = 10;
const LINE_HEIGHT = 14;

export type RenderMeta = {
  employer: EmployerData;
  employeeName: string;
  signDate: string;
};

export type RenderedDocument = {
  bytes: Uint8Array;
  signatureLayout: SignatureBlockLayout | null;
};

export const renderDocumentToPdf = async (
  document: GeneratedDocument,
  meta: RenderMeta,
): Promise<RenderedDocument> => {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const cursor = createCursor(pdfDoc, meta.employer, fonts);

  cursor.drawText(document.title, fonts.bold, 14, COLORS.darkBlue);
  cursor.y -= 4;
  cursor.drawWrapped(`Podstawa prawna: ${document.legalBasis}`, fonts.regular, 8, COLORS.gray);
  cursor.y -= 10;

  for (const section of document.sections) {
    if (section.heading) {
      cursor.ensureSpace(LINE_HEIGHT * 2);
      cursor.y -= 4;
      cursor.drawWrapped(section.heading, fonts.bold, 10, COLORS.darkBlue);
      cursor.y -= 2;
    }

    for (const paragraph of section.paragraphs ?? []) {
      cursor.drawWrapped(paragraph, fonts.regular, BODY_SIZE);
      cursor.y -= 2;
    }

    for (const field of section.fields ?? []) {
      cursor.ensureSpace(LINE_HEIGHT);
      cursor.page.drawText(`${field.label}:`, {
        x: MARGIN,
        y: cursor.y,
        size: BODY_SIZE,
        font: fonts.bold,
        color: COLORS.black,
      });
      const labelWidth = fonts.bold.widthOfTextAtSize(`${field.label}: `, BODY_SIZE);
      const valueLines = wrapText(field.value, fonts.regular, BODY_SIZE, CONTENT_WIDTH - labelWidth);
      cursor.page.drawText(valueLines[0] ?? "", {
        x: MARGIN + labelWidth,
        y: cursor.y,
        size: BODY_SIZE,
        font: fonts.regular,
        color: COLORS.black,
      });
      cursor.y -= LINE_HEIGHT;
      for (const extraLine of valueLines.slice(1)) {
        cursor.drawText(extraLine, fonts.regular, BODY_SIZE);
      }
    }

    cursor.y -= 6;
  }

  const signatureLayout = drawSignatureBlock(pdfDoc, cursor, document.signature, meta, fonts);

  cursor.ensureSpace(LINE_HEIGHT * 3);
  cursor.y -= 10;
  cursor.drawWrapped(disclaimerNote, fonts.regular, 7, COLORS.gray);

  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => drawFooter(page, index + 1, pages.length, fonts.regular));

  return { bytes: await pdfDoc.save(), signatureLayout };
};
