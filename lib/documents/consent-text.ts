/**
 * Deterministic consent wording for the signing certificate, keyed only by the
 * tenant's company name — lets a later signing step (e.g. the employer/sender
 * completing a two-party document) regenerate the exact wording an earlier
 * signer already agreed to, without persisting it separately.
 */
export const counterpartyConsentText = (companyName: string): string =>
  `Osoba podpisująca oświadcza, że zapoznała się z treścią niniejszego dokumentu i wyraża zgodę na złożenie podpisu elektronicznego (art. 6 ust. 1 lit. a RODO). Administratorem danych osobowych zawartych w dokumencie jest ${companyName}, który przetwarza dane w celu zawarcia i wykonania umowy (art. 6 ust. 1 lit. b RODO). Osobie podpisującej przysługuje prawo dostępu do danych, ich sprostowania, ograniczenia przetwarzania oraz wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.`;

export const employerConsentText = (companyName: string): string =>
  `Podpis reprezentanta ${companyName} potwierdzający zawarcie oraz akceptację warunków niniejszego dokumentu w imieniu administratora danych osobowych.`;
