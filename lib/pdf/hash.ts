import { createHash } from "node:crypto";

/** SHA-256 of a PDF's bytes, hex-encoded — used to prove a downloaded/verified copy matches what was generated. */
export const sha256Hex = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
