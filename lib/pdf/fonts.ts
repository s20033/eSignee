import fs from "node:fs";
import path from "node:path";
import type { PDFDocument, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type Fonts = { regular: PDFFont; bold: PDFFont };

/** Embeds the bundled Poppins TTFs so Polish diacritics (ą, ę, ś, ć, ł, ń, ó, ż, ź) render correctly — the standard PDF base-14 fonts only support WinAnsi encoding and throw on them. */
export const loadFonts = async (pdfDoc: PDFDocument): Promise<Fonts> => {
  pdfDoc.registerFontkit(fontkit);
  const fontsDir = path.join(process.cwd(), "lib/pdf/fonts");
  const regularBytes = fs.readFileSync(path.join(fontsDir, "Poppins-Regular.ttf"));
  const boldBytes = fs.readFileSync(path.join(fontsDir, "Poppins-Bold.ttf"));
  return {
    regular: await pdfDoc.embedFont(regularBytes, { subset: true }),
    bold: await pdfDoc.embedFont(boldBytes, { subset: true }),
  };
};
