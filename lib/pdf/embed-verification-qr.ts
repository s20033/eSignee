import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const MARGIN = 50;
const QR_SIZE = 70;

/** Embeds a QR code linking to the public verification page on the last page of a final, completed PDF. */
export const embedVerificationQr = async (
  pdfBytes: Uint8Array,
  verifyUrl: string,
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const qrPng = await QRCode.toBuffer(verifyUrl, { type: "png", margin: 1, width: 200 });
  const qrImage = await pdfDoc.embedPng(qrPng);

  const pages = pdfDoc.getPages();
  const page = pages[pages.length - 1];

  page.drawImage(qrImage, {
    x: PAGE_WIDTH - MARGIN - QR_SIZE,
    y: MARGIN,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  const font = await pdfDoc.embedFont("Helvetica");
  page.drawText("Zweryfikuj / Verify", {
    x: PAGE_WIDTH - MARGIN - QR_SIZE,
    y: MARGIN - 10,
    size: 7,
    font,
  });

  return pdfDoc.save();
};
