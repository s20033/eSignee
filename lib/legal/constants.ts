/**
 * Statutory constants for Polish employment/mandate contracts, 2026.
 * Ported from the legacy app's LEGAL_2026 config. Update yearly as rates change.
 */
export const LEGAL_2026 = {
  year: 2026,
  effectiveFrom: "2026-01-01",

  minHourlyRateZlecenieGrossPln: 31.4,
  zlecenieNoticePeriodDays: 14,

  minMonthlyWageGrossPln: 4806.0,
  standardNoticePeriodDays: 14,

  studentUnder26AgeLimitYears: 26,

  legalBases: {
    umowaZlecenie: "art. 734–741 KC",
    umowaOPrace: "art. 29 KP",
    minWage: "Rozporządzenie Rady Ministrów z 11.09.2025, Dz.U. 2025 poz. 1242",
    hoursEvidence: "art. 8b ustawy z 10.10.2002 o minimalnym wynagrodzeniu",
    bhp: "Kodeks Pracy art. 226 i nast., Rozporządzenie MZ",
    rodo: "Rozporządzenie (UE) 2016/679 (GDPR)",
    foreigner: "Ustawa o zatrudnianiu cudzoziemców, zmieniona 2025–2026",
  },
} as const;

export const FOREIGNER_DOCUMENT_LABELS: Record<string, string> = {
  visa: "Wiza",
  residence_card: "Karta pobytu",
  other: "Inne",
};
