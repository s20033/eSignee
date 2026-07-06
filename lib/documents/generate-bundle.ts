import { generateUmowaZlecenie } from "./generators/umowa-zlecenie";
import {
  generateZalacznikEwidencjaGodzin,
  generateZalacznikKontrolaTrzezwosci,
  generateZalacznikProtokolSprzetu,
} from "./generators/zlecenie-annexes";
import { generateUmowaOPrace } from "./generators/umowa-o-prace";
import {
  generateInformacjaWarunki,
  generateKartaBhp,
  generateKwestionariusz,
  generateOswiadczenieRodzicielskie,
  generatePit2,
} from "./generators/o-prace-annexes";
import {
  generateForeignerChecklist,
  generateOswiadczenieRodo,
  generateOswiadczenieWyplata,
  generateSkierowanieBadania,
  generateZalacznikOswiadczenieZus,
} from "./generators/shared-annexes";
import type { BundleInput, GeneratedDocument } from "./types";

/**
 * Assembles the full document bundle for one employee + contract, mirroring
 * the legacy generateDocumentBundle branch structure exactly (contract type,
 * then a foreigner checklist appended when applicable).
 */
export const generateDocumentBundle = (input: BundleInput): GeneratedDocument[] => {
  const { employee, contract, position, employer } = input;
  const docs: GeneratedDocument[] = [];

  if (contract.type === "zlecenie") {
    docs.push(generateUmowaZlecenie(input));
    docs.push(generateZalacznikEwidencjaGodzin());
    docs.push(generateZalacznikOswiadczenieZus(employee));
    docs.push(generateZalacznikProtokolSprzetu());
    docs.push(generateZalacznikKontrolaTrzezwosci());
    docs.push(generateSkierowanieBadania({ employee, position }));
    docs.push(generateOswiadczenieRodo({ employer }));
    docs.push(generateOswiadczenieWyplata(contract));
  } else {
    docs.push(generateUmowaOPrace(input));
    docs.push(generateInformacjaWarunki(contract));
    docs.push(generateKwestionariusz(employee));
    docs.push(generateSkierowanieBadania({ employee, position }));
    docs.push(generateKartaBhp());
    docs.push(generateZalacznikOswiadczenieZus(employee));
    docs.push(generatePit2());
    docs.push(generateOswiadczenieRodo({ employer }));
    docs.push(generateOswiadczenieWyplata(contract));
    docs.push(generateOswiadczenieRodzicielskie());
  }

  if (employee.isForeigner) {
    docs.push(generateForeignerChecklist(employee));
  }

  return docs;
};
