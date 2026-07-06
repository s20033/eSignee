import { LEGAL_2026 } from "@/lib/legal/constants";
import { DASH, fullName } from "../helpers";
import type { ContractInput, EmployeeContractData, GeneratedDocument } from "../types";

export const generateInformacjaWarunki = (contract: ContractInput): GeneratedDocument => {
  const weeklyHours = contract.weeklyHours || "40";
  return {
    id: "informacja_warunki",
    title: "Informacja o warunkach zatrudnienia",
    legalBasis: LEGAL_2026.legalBases.umowaOPrace,
    signature: "employee",
    sections: [
      {
        paragraphs: [
          `Niniejsza informacja jest przekazywana Pracownikowi zgodnie z ${LEGAL_2026.legalBases.umowaOPrace} (art. 29 §3 Kodeksu pracy), w terminie nie późniejszym niż 7 dni od dnia zawarcia umowy o pracę, i obejmuje dane niewskazane bezpośrednio w treści umowy.`,
        ],
        fields: [
          { label: "Norma dobowa i tygodniowa czasu pracy", value: `8 godzin dziennie / ${weeklyHours} godzin tygodniowo` },
          { label: "Częstotliwość wypłaty wynagrodzenia", value: "raz w miesiącu, do 10. dnia miesiąca następnego" },
          { label: "Wymiar przysługującego urlopu wypoczynkowego", value: "20 lub 26 dni w roku, zgodnie z Kodeksem Pracy" },
          { label: "Obowiązujący okres wypowiedzenia", value: `${LEGAL_2026.standardNoticePeriodDays} dni (z uwzględnieniem okresów ustawowych zależnych od stażu pracy)` },
          { label: "Dobowy i tygodniowy wymiar odpoczynku", value: "co najmniej 11 godzin nieprzerwanego odpoczynku dobowego i 35 godzin odpoczynku tygodniowego" },
          { label: "Zasady pracy w godzinach nadliczbowych", value: "wyłącznie w przypadkach przewidzianych w Kodeksie pracy, z dodatkowym wynagrodzeniem albo czasem wolnym" },
        ],
      },
      {
        paragraphs: [
          "Pracownik potwierdza otrzymanie niniejszej informacji oraz zapoznanie się z jej treścią. Pracodawca zobowiązuje się informować Pracownika o każdej zmianie powyższych warunków niezwłocznie, nie później niż w dniu wejścia takiej zmiany w życie.",
        ],
      },
    ],
  };
};

export const generateKwestionariusz = (employee: EmployeeContractData): GeneratedDocument => ({
  id: "kwestionariusz",
  title: "Kwestionariusz osobowy dla osoby ubiegającej się o zatrudnienie",
  legalBasis: LEGAL_2026.legalBases.umowaOPrace,
  signature: "employee",
  sections: [
    {
      heading: "1. Dane identyfikacyjne",
      fields: [
        { label: "Imię i nazwisko", value: fullName(employee) },
        { label: "Imiona rodziców", value: DASH },
        { label: "Data i miejsce urodzenia", value: DASH },
        { label: "PESEL", value: employee.pesel || DASH },
        { label: "Adres zamieszkania", value: employee.address || DASH },
        { label: "Adres do korespondencji (jeśli inny)", value: DASH },
        { label: "Obywatelstwo", value: employee.nationality || DASH },
        { label: "Numer telefonu kontaktowego", value: DASH },
      ],
    },
    {
      heading: "2. Wykształcenie",
      fields: [
        { label: "Nazwa szkoły / uczelni", value: DASH },
        { label: "Zawód / specjalność / tytuł", value: DASH },
        { label: "Rok zakończenia nauki", value: DASH },
      ],
    },
    {
      heading: "3. Przebieg dotychczasowego zatrudnienia",
      paragraphs: [
        "Należy wskazać poprzednich pracodawców, okresy zatrudnienia oraz zajmowane stanowiska, w zakresie niezbędnym do ustalenia uprawnień pracowniczych (np. stażu pracy wpływającego na wymiar urlopu i okres wypowiedzenia).",
      ],
      fields: [
        { label: "Poprzedni pracodawca / okres zatrudnienia", value: DASH },
        { label: "Zajmowane stanowisko", value: DASH },
      ],
    },
    {
      heading: "4. Oświadczenie",
      paragraphs: [
        "Oświadczam, że dane podane w niniejszym kwestionariuszu są zgodne z prawdą. Jestem świadomy/a odpowiedzialności za podanie nieprawdziwych danych oraz zobowiązuję się do niezwłocznego informowania Pracodawcy o każdej ich zmianie.",
      ],
    },
  ],
});

export const generateKartaBhp = (): GeneratedDocument => ({
  id: "karta_bhp",
  title: "Karta szkolenia wstępnego w zakresie BHP",
  legalBasis: LEGAL_2026.legalBases.bhp,
  signature: "two-party",
  sections: [
    {
      paragraphs: [
        "Niniejsza karta potwierdza przeprowadzenie szkolenia wstępnego w zakresie bezpieczeństwa i higieny pracy, obejmującego instruktaż ogólny oraz instruktaż stanowiskowy, zgodnie z Kodeksem pracy oraz rozporządzeniem Ministra Gospodarki i Pracy w sprawie szkolenia w dziedzinie bezpieczeństwa i higieny pracy. Pracownik nie może być dopuszczony do pracy bez odbycia i potwierdzenia niniejszego szkolenia.",
      ],
    },
    {
      heading: "1. Instruktaż ogólny",
      fields: [
        { label: "Zakres tematyczny", value: "Przepisy BHP, zasady poruszania się na terenie zakładu, postępowanie w razie wypadku, pierwsza pomoc, ochrona przeciwpożarowa" },
        { label: "Data przeprowadzenia", value: DASH },
        { label: "Przeprowadzający (imię, nazwisko, stanowisko)", value: DASH },
      ],
    },
    {
      heading: "2. Instruktaż stanowiskowy",
      fields: [
        { label: "Stanowisko pracy", value: DASH },
        { label: "Zakres tematyczny", value: "Czynniki środowiska pracy, ryzyko zawodowe, zasady bezpiecznego wykonywania pracy na danym stanowisku, obsługa maszyn i urządzeń" },
        { label: "Data przeprowadzenia", value: DASH },
        { label: "Przeprowadzający (imię, nazwisko, stanowisko)", value: DASH },
      ],
    },
    {
      paragraphs: [
        "Pracownik potwierdza, że odbył powyższe szkolenia, zrozumiał ich treść oraz zobowiązuje się do przestrzegania zasad bezpieczeństwa i higieny pracy obowiązujących na jego stanowisku.",
      ],
    },
  ],
});

export const generatePit2 = (): GeneratedDocument => ({
  id: "pit2",
  title: "PIT-2 — Oświadczenie/wniosek podatnika dla celów obliczania miesięcznych zaliczek na podatek dochodowy",
  legalBasis: LEGAL_2026.legalBases.umowaOPrace,
  signature: "employee",
  sections: [
    {
      paragraphs: [
        "Składam niniejsze oświadczenie na podstawie ustawy o podatku dochodowym od osób fizycznych, w celu zastosowania przez płatnika kwoty zmniejszającej miesięczne zaliczki na podatek dochodowy oraz w celu rozliczenia innych ulg, do których jestem uprawniony/a.",
      ],
      fields: [
        { label: "Oświadczenie o stosowaniu kwoty zmniejszającej podatek", value: DASH },
        { label: "Liczba podmiotów stosujących kwotę zmniejszającą (1/2/3)", value: DASH },
        { label: "Oświadczenie o zamiarze wspólnego opodatkowania / preferencji", value: DASH },
        { label: "Wniosek o niepobieranie zaliczek (jeśli dotyczy)", value: DASH },
        { label: "Wniosek o zwiększenie kosztów uzyskania przychodów (jeśli dotyczy)", value: DASH },
      ],
    },
    {
      paragraphs: [
        "Oświadczam, że jestem świadomy/a odpowiedzialności za podanie nieprawdziwych informacji mających wpływ na wysokość obliczanych zaliczek podatkowych oraz zobowiązuję się do niezwłocznego poinformowania płatnika o zmianie okoliczności mających wpływ na treść niniejszego oświadczenia.",
      ],
    },
  ],
});

export const generateOswiadczenieRodzicielskie = (): GeneratedDocument => ({
  id: "oswiadczenie_rodzicielskie",
  title: "Oświadczenie dotyczące uprawnień rodzicielskich",
  legalBasis: LEGAL_2026.legalBases.umowaOPrace,
  signature: "employee",
  sections: [
    {
      paragraphs: [
        "Niniejsze oświadczenie składane jest w celu ustalenia przez Pracodawcę uprawnień Pracownika wynikających z przepisów Kodeksu pracy dotyczących rodzicielstwa, w tym ograniczeń w zakresie delegowania, pracy w godzinach nadliczbowych i porze nocnej wobec pracowników wychowujących dziecko do określonego wieku.",
      ],
      fields: [
        { label: "Czy wychowuje Pan/Pani dziecko do 8. roku życia", value: DASH },
        { label: "Czy korzysta Pan/Pani z uprawnień rodzicielskich (urlop wychowawczy, opieka)", value: DASH },
        { label: "Czy drugi rodzic / opiekun korzysta z analogicznych uprawnień", value: DASH },
      ],
    },
    {
      paragraphs: [
        "Oświadczam, że powyższe informacje są zgodne ze stanem faktycznym oraz zobowiązuję się do niezwłocznego poinformowania Pracodawcy o każdej zmianie mającej wpływ na zakres przysługujących mi uprawnień rodzicielskich.",
      ],
    },
  ],
});
