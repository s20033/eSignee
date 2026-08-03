import { randomUUID } from "node:crypto";

/** 8-char uppercase code for the /join/{code} employee self-registration link. Collision risk is negligible at this scale (32 bits of entropy); the DB's unique constraint is the backstop. */
export const generateInviteCode = () => randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
