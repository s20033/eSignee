import { LEGAL_2026 } from "@/lib/legal/constants";
import { DASH, employerBlock, fullName, representedByClause } from "../helpers";
import type { BundleInput, GeneratedDocument } from "../types";

export const generateUmowaZlecenie = ({
  employee,
  contract,
  position,
  employer,
}: BundleInput): GeneratedDocument => {
  const positionName = position?.namePl || DASH;
  const occupationCode = position?.occupationCode || DASH;
  const workplace = position?.workplace || DASH;
  const fullDescription = position?.fullDescription || DASH;
  const rate = contract.hourlyRate || String(LEGAL_2026.minHourlyRateZlecenieGrossPln);

  return {
    id: "umowa_zlecenie",
    title: "Umowa zlecenia",
    legalBasis: LEGAL_2026.legalBases.umowaZlecenie,
    signature: "two-party",
    sections: [
      {
        paragraphs: [
          `Umowa zlecenia zawarta w dniu ${contract.startDate || DASH} w miejscowości ${employer.signingPlace} (dalej: „Umowa”), pomiędzy:`,
          `${employerBlock(employer)}, ${representedByClause(employer)}, zwaną dalej „Zleceniodawcą”,`,
          "a",
          `${fullName(employee)}, PESEL: ${employee.pesel || DASH}, legitymującym/ą się dokumentem tożsamości nr ${employee.passportNumber || DASH}, zamieszkałym/ą przy ${employee.address || DASH}, zwanym/ą dalej „Zleceniobiorcą”,`,
          `łącznie zwanymi dalej „Stronami”, a każda z osobna „Stroną”.`,
        ],
      },
      {
        heading: "§1. Przedmiot umowy",
        paragraphs: [
          `1.1. Zleceniodawca zleca, a Zleceniobiorca przyjmuje do wykonania zlecenie polegające na świadczeniu czynności na stanowisku: ${positionName} (kod zawodu wg klasyfikacji zawodów i specjalności: ${occupationCode}).`,
          `1.2. Szczegółowy zakres czynności obejmuje: ${fullDescription}`,
          "1.3. Zleceniobiorca zobowiązuje się wykonywać zlecenie osobiście, z należytą starannością wymaganą w stosunkach danego rodzaju, zgodnie z poleceniami Zleceniodawcy wydawanymi w granicach przedmiotu Umowy oraz zgodnie z obowiązującymi przepisami prawa, w tym przepisami bezpieczeństwa i higieny pracy.",
          "1.4. Zleceniobiorca może powierzyć wykonanie zlecenia osobie trzeciej wyłącznie po uzyskaniu wcześniejszej, pisemnej zgody Zleceniodawcy; w takim przypadku Zleceniobiorca odpowiada za działania i zaniechania tej osoby jak za własne.",
        ],
      },
      {
        heading: "§2. Miejsce i czas wykonywania zlecenia",
        paragraphs: [
          `2.1. Miejscem wykonywania zlecenia jest: ${workplace}.`,
          "2.2. Zleceniodawca może, w uzasadnionych przypadkach związanych z organizacją pracy, wyznaczyć inne miejsce wykonywania czynności, o czym poinformuje Zleceniobiorcę z odpowiednim wyprzedzeniem.",
        ],
        fields: [
          { label: "Data rozpoczęcia wykonywania zlecenia", value: contract.startDate || DASH },
          { label: "Data zakończenia / czas trwania", value: contract.endDate || "czas nieokreślony" },
          { label: "Minimalna liczba godzin w tygodniu", value: contract.minHours || DASH },
        ],
      },
      {
        heading: "§3. Wynagrodzenie i sposób płatności",
        paragraphs: [
          `3.1. Strony ustalają wynagrodzenie Zleceniobiorcy w wysokości ${rate} PLN brutto za każdą godzinę wykonywania zlecenia, nie niższej niż obowiązująca minimalna stawka godzinowa, określona w ${LEGAL_2026.legalBases.minWage}.`,
          "3.2. Wynagrodzenie obliczane jest na podstawie liczby godzin faktycznie przepracowanych, potwierdzonej w ewidencji godzin stanowiącej Załącznik nr 1 do niniejszej Umowy.",
          "3.3. Wynagrodzenie wypłacane jest w okresach miesięcznych, nie później niż do 10. dnia miesiąca następującego po miesiącu, w którym zlecenie było wykonywane.",
          `3.4. Wypłata wynagrodzenia następuje w formie: ${contract.paymentMethod || "przelewem"}, na rachunek bankowy wskazany przez Zleceniobiorcę w Załączniku nr 5 (Oświadczenie o sposobie wypłaty wynagrodzenia).`,
          "3.5. Od wynagrodzenia Zleceniodawca, jako płatnik, odprowadza zaliczki na podatek dochodowy oraz, o ile wynika to z obowiązujących przepisów i oświadczeń Zleceniobiorcy, składki na ubezpieczenia społeczne i zdrowotne.",
        ],
      },
      {
        heading: "§4. Obowiązki Zleceniobiorcy",
        paragraphs: [
          "4.1. Zleceniobiorca zobowiązuje się do rzetelnego prowadzenia ewidencji godzin wykonywania zlecenia oraz przekazywania jej Zleceniodawcy w terminach przez niego wskazanych, zgodnie z art. 8b ustawy o minimalnym wynagrodzeniu za pracę.",
          "4.2. Zleceniobiorca zobowiązuje się do przestrzegania przepisów i zasad bezpieczeństwa i higieny pracy, w tym do udziału w szkoleniach BHP oraz poddania się wymaganym badaniom lekarskim, których zakres określa Załącznik nr 6 (Skierowanie na badania lekarskie).",
          "4.3. Zleceniobiorca zobowiązuje się zachować w tajemnicy wszelkie informacje techniczne, organizacyjne i handlowe Zleceniodawcy, o których dowiedział się w związku z wykonywaniem Umowy, również po jej rozwiązaniu.",
          "4.4. Zleceniobiorca zobowiązuje się dbać o powierzony mu sprzęt i materiały oraz zwrócić je w stanie niepogorszonym, z uwzględnieniem normalnego zużycia, zgodnie z Załącznikiem nr 3 (Protokół przekazania i zwrotu sprzętu).",
          "4.5. Zleceniobiorca niezwłocznie informuje Zleceniodawcę o wszelkich okolicznościach mogących mieć wpływ na prawidłowe wykonanie zlecenia, w tym o przeszkodach w jego wykonywaniu.",
        ],
      },
      {
        heading: "§5. Obowiązki Zleceniodawcy",
        paragraphs: [
          "5.1. Zleceniodawca zobowiązuje się zapewnić Zleceniobiorcy niezbędne narzędzia, materiały oraz informacje wymagane do prawidłowego wykonania zlecenia, o ile z charakteru zlecenia nie wynika inaczej.",
          "5.2. Zleceniodawca zobowiązuje się wypłacać wynagrodzenie w terminach i w sposób określony w §3 niniejszej Umowy.",
          "5.3. Zleceniodawca zobowiązuje się zapewnić Zleceniobiorcy warunki wykonywania zlecenia zgodne z przepisami bezpieczeństwa i higieny pracy oraz przeprowadzić wymagane instruktaże stanowiskowe.",
        ],
      },
      {
        heading: "§6. Odpowiedzialność stron",
        paragraphs: [
          "6.1. Zleceniobiorca odpowiada za szkody wyrządzone Zleceniodawcy lub osobom trzecim na zasadach ogólnych wynikających z Kodeksu cywilnego, w szczególności w przypadku niezachowania należytej staranności przy wykonywaniu zlecenia.",
          "6.2. Zleceniodawca nie odpowiada za szkody powstałe wskutek nieprzestrzegania przez Zleceniobiorcę przepisów BHP, zasad kontroli trzeźwości (Załącznik nr 4) lub poleceń wydanych w granicach Umowy.",
          "6.3. W przypadku nieuzasadnionego niewykonania zlecenia przez Zleceniobiorcę, Zleceniodawca może żądać naprawienia szkody wynikłej z tego tytułu, na zasadach ogólnych.",
        ],
      },
      {
        heading: "§7. Czas trwania i rozwiązanie umowy",
        paragraphs: [
          `7.1. Niniejsza Umowa zostaje zawarta na okres od ${contract.startDate || DASH} do ${contract.endDate || "czasu nieokreślonego"}.`,
          `7.2. Każda ze Stron może rozwiązać Umowę z zachowaniem ${LEGAL_2026.zlecenieNoticePeriodDays}-dniowego okresu wypowiedzenia, składanego w formie pisemnej lub elektronicznej.`,
          "7.3. Zleceniodawca może rozwiązać Umowę bez zachowania okresu wypowiedzenia w przypadku rażącego naruszenia przez Zleceniobiorcę istotnych postanowień Umowy, w tym zasad BHP lub zasad kontroli trzeźwości.",
          "7.4. Rozwiązanie Umowy nie zwalnia Zleceniobiorcy z obowiązku zachowania tajemnicy określonej w §4 ust. 4.3 oraz z obowiązku rozliczenia powierzonego sprzętu i materiałów.",
        ],
      },
      {
        heading: "§8. Ochrona danych osobowych",
        paragraphs: [
          `8.1. Dane osobowe Zleceniobiorcy są przetwarzane przez Zleceniodawcę zgodnie z ${LEGAL_2026.legalBases.rodo}, w celach związanych z wykonaniem Umowy, rozliczeniami podatkowo-składkowymi oraz obowiązkami archiwizacyjnymi.`,
          "8.2. Szczegółowe informacje o przetwarzaniu danych osobowych, w tym o prawach Zleceniobiorcy, zawiera Załącznik nr 7 (Klauzula informacyjna RODO).",
        ],
      },
      {
        heading: "§9. Postanowienia końcowe",
        paragraphs: [
          "9.1. W sprawach nieuregulowanych niniejszą Umową zastosowanie mają przepisy Kodeksu cywilnego oraz innych właściwych przepisów prawa polskiego.",
          "9.2. Wszelkie zmiany Umowy wymagają formy pisemnej pod rygorem nieważności.",
          "9.3. Spory wynikłe na tle wykonywania Umowy Strony będą starały się rozwiązać w drodze negocjacji, a w przypadku braku porozumienia — właściwy będzie sąd siedziby Zleceniodawcy.",
          `9.4. Integralną część Umowy stanowią załączniki: Załącznik nr 1 (Ewidencja godzin), Załącznik nr 2 (Oświadczenie ZUS), Załącznik nr 3 (Protokół przekazania sprzętu), Załącznik nr 4 (Zasady kontroli trzeźwości), Załącznik nr 5 (Oświadczenie o sposobie wypłaty wynagrodzenia), Załącznik nr 6 (Skierowanie na badania lekarskie), Załącznik nr 7 (Klauzula informacyjna RODO)${employee.isForeigner ? ", Załącznik nr 8 (Checklist — zatrudnienie cudzoziemca)" : ""}.`,
          "9.5. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.",
        ],
      },
    ],
  };
};
