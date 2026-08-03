import { LEGAL_2026 } from "@/lib/legal/constants";
import { DASH, employerBlock, fullName, representedByClause } from "../helpers";
import type { BundleInput, GeneratedDocument } from "../types";

export const generateUmowaOPrace = ({
  employee,
  contract,
  position,
  employer,
}: BundleInput): GeneratedDocument => {
  const positionName = position?.namePl || DASH;
  const workplace = position?.workplace || DASH;
  const fullDescription = position?.fullDescription || DASH;
  const wage = contract.monthlyWage || String(LEGAL_2026.minMonthlyWageGrossPln);
  const weeklyHours = contract.weeklyHours || "40";

  return {
    id: "umowa_o_prace",
    title: "Umowa o pracę",
    legalBasis: LEGAL_2026.legalBases.umowaOPrace,
    signature: "two-party",
    sections: [
      {
        paragraphs: [
          `Umowa o pracę zawarta w dniu ${contract.startDate || DASH} w miejscowości ${employer.signingPlace} (dalej: „Umowa”), pomiędzy:`,
          `${employerBlock(employer)}, ${representedByClause(employer)}, zwaną dalej „Pracodawcą”,`,
          "a",
          `${fullName(employee)}, PESEL: ${employee.pesel || DASH}, zamieszkałym/ą przy ${employee.address || DASH}, zwanym/ą dalej „Pracownikiem”,`,
          `łącznie zwanymi dalej „Stronami”.`,
        ],
      },
      {
        heading: "§1. Rodzaj umowy i stanowisko",
        paragraphs: [
          `1.1. Pracodawca zatrudnia Pracownika na czas ${contract.endDate ? "określony, do dnia " + contract.endDate : "nieokreślony"}, na stanowisku: ${positionName}.`,
          `1.2. Zakres obowiązków na stanowisku obejmuje: ${fullDescription}`,
          "1.3. Pracownik zobowiązuje się wykonywać powierzone obowiązki sumiennie i starannie oraz stosować się do poleceń przełożonych, które dotyczą pracy, jeżeli nie są one przeciwne przepisom prawa lub umowie o pracę.",
        ],
      },
      {
        heading: "§2. Miejsce wykonywania pracy",
        paragraphs: [
          `2.1. Miejscem wykonywania pracy jest: ${workplace}.`,
          "2.2. Pracodawca może wysłać Pracownika w podróż służbową w granicach uzasadnionych potrzebami Pracodawcy, na zasadach i za wynagrodzeniem określonym w obowiązujących przepisach.",
        ],
      },
      {
        heading: "§3. Wymiar czasu pracy",
        paragraphs: [
          `3.1. Pracownik zatrudniony jest w wymiarze ${weeklyHours} godzin tygodniowo, w przeciętnie pięciodniowym tygodniu pracy, w podstawowym systemie czasu pracy, o ile Strony nie postanowiły inaczej.`,
          "3.2. Praca w godzinach nadliczbowych jest dopuszczalna wyłącznie w przypadkach przewidzianych w Kodeksie pracy i podlega dodatkowemu wynagrodzeniu lub czasowi wolnemu zgodnie z obowiązującymi przepisami.",
        ],
      },
      {
        heading: "§4. Wynagrodzenie",
        paragraphs: [
          `4.1. Pracownikowi przysługuje wynagrodzenie miesięczne brutto w wysokości ${wage} PLN, nie niższe niż obowiązujące minimalne wynagrodzenie za pracę określone w ${LEGAL_2026.legalBases.minWage}.`,
          `4.2. Wynagrodzenie wypłacane jest ${contract.paymentMethod || "przelewem"} na rachunek bankowy Pracownika, nie później niż do 10. dnia następnego miesiąca kalendarzowego.`,
          "4.3. Wynagrodzenie podlega corocznej waloryzacji w przypadku zmiany ustawowej kwoty minimalnego wynagrodzenia za pracę, w zakresie niezbędnym do zachowania zgodności z przepisami.",
        ],
      },
      {
        heading: "§5. Obowiązki Pracownika",
        paragraphs: [
          "5.1. Pracownik zobowiązany jest przestrzegać czasu pracy ustalonego w zakładzie pracy, regulaminu pracy, przepisów oraz zasad bezpieczeństwa i higieny pracy, a także przepisów przeciwpożarowych.",
          "5.2. Pracownik zobowiązany jest dbać o dobro zakładu pracy, chronić jego mienie oraz zachować w tajemnicy informacje, których ujawnienie mogłoby narazić Pracodawcę na szkodę.",
          "5.3. Pracownik zobowiązany jest poddać się wstępnym, okresowym i kontrolnym badaniom lekarskim oraz odbyć wymagane szkolenia BHP, zgodnie z odpowiednimi załącznikami do niniejszej Umowy.",
        ],
      },
      {
        heading: "§6. Obowiązki Pracodawcy",
        paragraphs: [
          "6.1. Pracodawca zobowiązany jest zaznajomić Pracownika z zakresem jego obowiązków, sposobem wykonywania pracy oraz podstawowymi uprawnieniami.",
          "6.2. Pracodawca zobowiązany jest organizować pracę w sposób zapewniający pełne wykorzystanie czasu pracy oraz wysoką jakość i wydajność pracy, przy wykorzystaniu uzdolnień i kwalifikacji Pracownika.",
          "6.3. Pracodawca zobowiązany jest zapewnić bezpieczne i higieniczne warunki pracy oraz prowadzić systematyczne szkolenia w tym zakresie.",
          "6.4. Pracodawca zobowiązany jest terminowo i prawidłowo wypłacać wynagrodzenie oraz prowadzić dokumentację pracowniczą zgodnie z obowiązującymi przepisami.",
        ],
      },
      {
        heading: "§7. Urlop wypoczynkowy",
        paragraphs: [
          "Pracownikowi przysługuje prawo do urlopu wypoczynkowego w wymiarze określonym przepisami Kodeksu pracy (20 albo 26 dni w roku kalendarzowym, w zależności od stażu pracy), na zasadach i w terminach uzgadnianych z Pracodawcą, zgodnie z planem urlopów.",
        ],
      },
      {
        heading: "§8. Rozwiązanie umowy",
        paragraphs: [
          `8.1. Umowa może zostać rozwiązana przez każdą ze Stron z zachowaniem ${LEGAL_2026.standardNoticePeriodDays}-dniowego okresu wypowiedzenia, z uwzględnieniem okresów wypowiedzenia wynikających z Kodeksu pracy w zależności od stażu pracy u danego Pracodawcy, jeżeli są one dłuższe.`,
          "8.2. Umowa może zostać rozwiązana bez zachowania okresu wypowiedzenia w przypadkach przewidzianych w Kodeksie pracy, w tym w razie ciężkiego naruszenia przez Pracownika podstawowych obowiązków pracowniczych.",
          "8.3. Umowa rozwiązuje się również z upływem czasu, na który została zawarta — w przypadku umowy na czas określony.",
        ],
      },
      {
        heading: "§9. Bezpieczeństwo i higiena pracy",
        paragraphs: [
          "Pracownik przed przystąpieniem do pracy zostanie poddany wstępnym badaniom lekarskim oraz przejdzie szkolenie wstępne BHP (instruktaż ogólny i stanowiskowy), zgodnie z Załącznikiem (Karta szkolenia BHP). Pracownik zobowiązany jest do bieżącego stosowania środków ochrony indywidualnej powierzonych przez Pracodawcę.",
        ],
      },
      {
        heading: "§10. Ochrona danych osobowych",
        paragraphs: [
          `Dane osobowe Pracownika są przetwarzane przez Pracodawcę zgodnie z ${LEGAL_2026.legalBases.rodo} oraz Kodeksem pracy, w celach związanych z realizacją niniejszej Umowy i obowiązkami prawnymi Pracodawcy. Szczegóły zawiera Klauzula informacyjna RODO stanowiąca załącznik do niniejszej Umowy.`,
        ],
      },
      {
        heading: "§11. Postanowienia końcowe",
        paragraphs: [
          "11.1. W sprawach nieuregulowanych niniejszą Umową zastosowanie mają przepisy Kodeksu pracy oraz innych właściwych przepisów prawa pracy.",
          "11.2. Wszelkie zmiany Umowy wymagają formy pisemnej pod rygorem nieważności, z zachowaniem przepisów o zmianie warunków pracy i płacy.",
          "11.3. Integralną część Umowy stanowią załączniki wymienione w pakiecie dokumentów przekazanym Pracownikowi w dniu zawarcia Umowy.",
          "11.4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.",
        ],
      },
    ],
  };
};
