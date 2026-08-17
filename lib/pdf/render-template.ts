import { PDFDocument } from "pdf-lib";
import { loadFonts } from "./fonts";
import { createCursor, drawFooter, drawSignatureBlock, COLORS, type RoleLabels, type SignatureBlockLayout } from "./chrome";
import { disclaimerNote } from "@/lib/documents/helpers";
import type { EmployerData, SignatureType } from "@/lib/documents/types";

const BODY_SIZE = 10;

export type RenderTemplateMeta = {
  employeeName: string;
  signDate: string;
  signatureType: SignatureType;
  roleLabels?: RoleLabels | null;
};

export type RenderedDocument = {
  bytes: Uint8Array;
  signatureLayout: SignatureBlockLayout | null;
};

/** Renders an employer-authored `{{placeholder}}` template (already substituted) as a lettered PDF, matching the look of the built-in contract generators. */
export const renderTemplateDocumentToPdf = async (
  title: string,
  body: string,
  employer: EmployerData,
  meta: RenderTemplateMeta,
): Promise<RenderedDocument> => {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const cursor = createCursor(pdfDoc, employer, fonts);

  cursor.drawText(title, fonts.bold, 14, COLORS.darkBlue);
  cursor.y -= 10;

  for (const paragraph of body.split(/\n{2,}/)) {
    for (const line of paragraph.split("\n")) {
      cursor.drawWrapped(line, fonts.regular, BODY_SIZE);
    }
    cursor.y -= 8;
  }

  const signatureLayout = drawSignatureBlock(
    pdfDoc,
    cursor,
    meta.signatureType,
    { employer, employeeName: meta.employeeName, signDate: meta.signDate, roleLabels: meta.roleLabels },
    fonts,
  );

  cursor.ensureSpace(14 * 3);
  cursor.y -= 10;
  cursor.drawWrapped(disclaimerNote, fonts.regular, 7, COLORS.gray);

  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => drawFooter(page, index + 1, pages.length, fonts.regular));

  return { bytes: await pdfDoc.save(), signatureLayout };
};
