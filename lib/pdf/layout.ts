import type { PDFFont } from "pdf-lib";

/** Greedy word-wrap: pdf-lib has no built-in text-wrapping helper like jsPDF's splitTextToSize. */
export const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
};
