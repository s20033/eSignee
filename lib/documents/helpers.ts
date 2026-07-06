import { LEGAL_2026 } from "@/lib/legal/constants";
import type { EmployeeContractData, EmployerData } from "./types";

export const DASH = ".....................";

export const fullName = (employee: EmployeeContractData) =>
  `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || DASH;

export const employerBlock = (employer: EmployerData) =>
  `${employer.name}, z siedzibą przy ${employer.address || DASH}, wpisana do Krajowego Rejestru Sądowego pod numerem KRS: ${employer.krs || DASH}, NIP: ${employer.taxId || DASH}`;

export const disclaimerNote =
  "Niniejszy dokument jest wzorem wygenerowanym automatycznie. Przed użyciem powinien być zweryfikowany " +
  `przez specjalistę ds. kadr lub radcę prawnego. Dane statutowe aktualne na rok ${LEGAL_2026.year} — zweryfikuj aktualność przepisów.`;
