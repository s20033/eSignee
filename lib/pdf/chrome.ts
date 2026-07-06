import { type PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import { wrapText } from "./layout";
import type { EmployerData, SignatureType } from "@/lib/documents/types";
import type { Fonts } from "./fonts";

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 50;
export const TOP_MARGIN = 110;
export const START_Y = PAGE_HEIGHT - TOP_MARGIN;
export const BOTTOM_MARGIN = 70;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export const COLORS = {
  darkBlue: rgb(0, 0.2, 0.4),
  gray: rgb(0.4, 0.4, 0.4),
  black: rgb(0, 0, 0),
  lightGray: rgb(0.8, 0.8, 0.8),
};

export const drawLetterhead = (page: PDFPage, employer: EmployerData, fonts: Fonts) => {
  page.drawText(employer.name, { x: MARGIN, y: PAGE_HEIGHT - 40, size: 12, font: fonts.bold, color: COLORS.darkBlue });

  const detailParts = [employer.address, employer.taxId ? `NIP: ${employer.taxId}` : null, employer.regon ? `REGON: ${employer.regon}` : null, employer.krs ? `KRS: ${employer.krs}` : null].filter(Boolean);

  if (detailParts.length > 0) {
    page.drawText(detailParts.join(" · "), {
      x: MARGIN,
      y: PAGE_HEIGHT - 55,
      size: 8,
      font: fonts.regular,
      color: COLORS.gray,
    });
  }

  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 65 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 65 },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
};

export const drawFooter = (page: PDFPage, pageNumber: number, totalPages: number, font: PDFFont) => {
  const footerY = BOTTOM_MARGIN - 20;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 10 },
    end: { x: PAGE_WIDTH - MARGIN, y: footerY + 10 },
    thickness: 0.5,
    color: COLORS.lightGray,
  });
  page.drawText(`Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}`, {
    x: MARGIN,
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray,
  });
  const pageLabel = `Strona ${pageNumber} z ${totalPages}`;
  page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(pageLabel, 7),
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray,
  });
};

type Cursor = {
  page: PDFPage;
  y: number;
};

export const createCursor = (pdfDoc: PDFDocument, employer: EmployerData, fonts: Fonts): Cursor & {
  ensureSpace: (needed: number) => void;
  drawText: (text: string, font: PDFFont, size: number, color?: ReturnType<typeof rgb>) => void;
  drawWrapped: (text: string, font: PDFFont, size: number, color?: ReturnType<typeof rgb>) => void;
} => {
  const cursor: Cursor = { page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: START_Y };
  drawLetterhead(cursor.page, employer, fonts);

  const ensureSpace = (needed: number) => {
    if (cursor.y - needed < BOTTOM_MARGIN) {
      cursor.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawLetterhead(cursor.page, employer, fonts);
      cursor.y = START_Y;
    }
  };

  const drawText = (text: string, font: PDFFont, size: number, color: ReturnType<typeof rgb> = COLORS.black) => {
    ensureSpace(14);
    cursor.page.drawText(text, { x: MARGIN, y: cursor.y, size, font, color });
    cursor.y -= 14;
  };

  const drawWrapped = (text: string, font: PDFFont, size: number, color: ReturnType<typeof rgb> = COLORS.black) => {
    const lines = wrapText(text, font, size, CONTENT_WIDTH);
    for (const line of lines) {
      ensureSpace(14);
      cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size, font, color });
      cursor.y -= 14;
    }
  };

  return {
    get page() {
      return cursor.page;
    },
    get y() {
      return cursor.y;
    },
    set y(value: number) {
      cursor.y = value;
    },
    ensureSpace,
    drawText,
    drawWrapped,
  };
};

export type SignatureRect = { x: number; y: number; maxWidth: number; maxHeight: number };
export type SignatureBlockLayout = {
  pageIndex: number;
  employer: (SignatureRect & { stamp: { x: number; y: number; size: number } }) | null;
  employee: SignatureRect | null;
};

const STAMP_SIZE = 70;
const SIGNATURE_SLOT_HEIGHT = 100;

/**
 * Draws the "who signs where" block on the current page and returns the coordinates
 * of each party's placeholder — persisted on the document row so a later signing
 * step can place the real signature image (and, for the employer, the company stamp)
 * in the same spot rather than on a separate page.
 */
export const drawSignatureBlock = (
  pdfDoc: PDFDocument,
  cursor: ReturnType<typeof createCursor>,
  signature: SignatureType,
  meta: { employer: EmployerData; employeeName: string; signDate: string },
  fonts: Fonts,
): SignatureBlockLayout | null => {
  if (!signature) return null;

  cursor.ensureSpace(220);
  cursor.y -= 10;
  cursor.drawText(`Miejsce i data: Lublin, dnia ${meta.signDate}`, fonts.regular, 9, COLORS.gray);
  cursor.y -= 16;

  const colWidth = (CONTENT_WIDTH - 20) / 2;
  const lineY = cursor.y;
  // drawSignatureBlock always runs as the last content operation before any more
  // pages are added, so the current page is simply the last one so far.
  const pageIndex = pdfDoc.getPageCount() - 1;

  const drawColumn = (x: number, label: string, name: string, reserveStampSpace: boolean) => {
    cursor.page.drawText(label, { x, y: lineY, size: 9, font: fonts.bold, color: COLORS.black });

    const lineYPos = lineY - 8 - SIGNATURE_SLOT_HEIGHT;
    cursor.page.drawLine({
      start: { x, y: lineYPos },
      end: { x: x + colWidth, y: lineYPos },
      thickness: 0.5,
      color: COLORS.gray,
    });
    cursor.page.drawText(name, { x, y: lineYPos - 10, size: 8, font: fonts.regular, color: COLORS.gray });

    const rect: SignatureRect = {
      x,
      y: lineYPos,
      maxWidth: reserveStampSpace ? colWidth - STAMP_SIZE - 15 : colWidth,
      maxHeight: SIGNATURE_SLOT_HEIGHT,
    };
    const stamp = reserveStampSpace
      ? { x: x + colWidth - STAMP_SIZE, y: lineYPos + (SIGNATURE_SLOT_HEIGHT - STAMP_SIZE) / 2, size: STAMP_SIZE }
      : undefined;

    return { rect, stamp };
  };

  let employer: SignatureBlockLayout["employer"] = null;
  let employee: SignatureRect | null = null;

  if (signature === "two-party") {
    const employerCol = drawColumn(MARGIN, "Pracodawca / Zleceniodawca:", meta.employer.name, true);
    const employeeCol = drawColumn(MARGIN + colWidth + 20, "Pracownik / Zleceniobiorca:", meta.employeeName, false);
    employer = { ...employerCol.rect, stamp: employerCol.stamp! };
    employee = employeeCol.rect;
  } else if (signature === "employer") {
    const employerCol = drawColumn(MARGIN, "Pracodawca / Zleceniodawca:", meta.employer.name, true);
    employer = { ...employerCol.rect, stamp: employerCol.stamp! };
  } else {
    const employeeCol = drawColumn(MARGIN, "Pracownik / Zleceniobiorca:", meta.employeeName, false);
    employee = employeeCol.rect;
  }

  cursor.y = lineY - 8 - SIGNATURE_SLOT_HEIGHT - 24;

  return { pageIndex, employer, employee };
};
