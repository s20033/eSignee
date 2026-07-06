import { LEGAL_2026 } from "@/lib/legal/constants";
import { DASH, employerBlock, fullName } from "../helpers";
import type { BundleInput, ContractInput, EmployeeContractData, GeneratedDocument, PositionData } from "../types";

export const generateZalacznikOswiadczenieZus = (
  employee: EmployeeContractData,
): GeneratedDocument => ({
  id: "zalacznik_2_oswiadczenie_zus",
  title: "Załącznik nr 2 — Oświadczenie do celów ubezpieczeń społecznych i zdrowotnych",
  legalBasis: LEGAL_2026.legalBases.umowaZlecenie,
  signature: "employee",
  sections: [
    {
      paragraphs: [
        "Niniejsze oświadczenie składane jest w celu prawidłowego ustalenia przez Zleceniodawcę, jako płatnika składek, obowiązku ubezpieczeń społecznych i ubezpieczenia zdrowotnego z tytułu wykonywania niniejszej Umowy.",
        employee.isStudent
          ? `Oświadczam, że jestem uczniem lub studentem w wieku poniżej ${LEGAL_2026.studentUnder26AgeLimitYears} lat i na podstawie art. 6 ust. 4 ustawy o systemie ubezpieczeń społecznych jestem zwolniony/a z obowiązkowych składek na ubezpieczenia społeczne i ubezpieczenie zdrowotne z tytułu niniejszej Umowy zlecenia.`
          : "Oświadczam, że nie jestem uczniem lub studentem w wieku poniżej 26 lat i podlegam ogólnym zasadom obowiązkowych ubezpieczeń społecznych i ubezpieczenia zdrowotnego z tytułu niniejszej Umowy zlecenia.",
        "Oświadczam, że posiadam / nie posiadam (niepotrzebne skreślić) inne tytuły do ubezpieczeń społecznych (w tym: inną umowę o pracę, inną umowę zlecenia, prowadzenie działalności gospodarczej, status emeryta lub rencisty). W przypadku posiadania innych tytułów, podaję poniżej ich szczegóły.",
        "Zobowiązuję się do niezwłocznego, pisemnego poinformowania Zleceniodawcy o każdej zmianie okoliczności mających wpływ na obowiązek ubezpieczeń, pod rygorem odpowiedzialności za wynikłe z tego szkody, w tym zaległości składkowe.",
      ],
      fields: [
        { label: "Inne tytuły do ubezpieczeń (jeśli dotyczy)", value: DASH },
        { label: "Nazwa płatnika innego tytułu", value: DASH },
      ],
    },
  ],
});

export const generateSkierowanieBadania = ({
  employee,
  position,
}: {
  employee: EmployeeContractData;
  position: PositionData;
}): GeneratedDocument => ({
  id: "skierowanie_badania",
  title: "Skierowanie na badania lekarskie",
  legalBasis: LEGAL_2026.legalBases.bhp,
  signature: "employer",
  sections: [
    {
      paragraphs: [
        "Niniejsze skierowanie wystawia się w związku z koniecznością przeprowadzenia profilaktycznych badań lekarskich (wstępnych / okresowych / kontrolnych — niepotrzebne skreślić) przed dopuszczeniem do wykonywania czynności na stanowisku wskazanym poniżej, zgodnie z przepisami Kodeksu pracy oraz rozporządzeniem Ministra Zdrowia w sprawie przeprowadzania badań lekarskich.",
      ],
      fields: [
        { label: "Stanowisko / rodzaj wykonywanej pracy", value: position?.namePl || DASH },
        { label: "Pracownik / Zleceniobiorca", value: fullName(employee) },
        { label: "PESEL", value: employee.pesel || DASH },
      ],
    },
    {
      heading: "Opis czynności i czynniki szkodliwe / warunki uciążliwe",
      paragraphs: [position?.fullDescription || DASH],
    },
  ],
});

export const generateOswiadczenieRodo = ({
  employer,
}: {
  employer: BundleInput["employer"];
}): GeneratedDocument => ({
  id: "oswiadczenie_rodo",
  title: "Klauzula informacyjna RODO oraz zgoda na przetwarzanie danych osobowych",
  legalBasis: LEGAL_2026.legalBases.rodo,
  signature: "employee",
  sections: [
    {
      heading: "1. Administrator danych osobowych",
      paragraphs: [`${employerBlock(employer)} jest administratorem Pani/Pana danych osobowych.`],
    },
    {
      heading: "2. Cele i podstawy prawne przetwarzania",
      paragraphs: [
        "Dane osobowe będą przetwarzane w celu: (a) realizacji niniejszej umowy — na podstawie art. 6 ust. 1 lit. b RODO, (b) wypełnienia obowiązków prawnych ciążących na administratorze, w tym podatkowych, ubezpieczeniowych i archiwizacyjnych — na podstawie art. 6 ust. 1 lit. c RODO, (c) ustalenia, dochodzenia lub obrony przed roszczeniami — na podstawie prawnie uzasadnionego interesu administratora, art. 6 ust. 1 lit. f RODO, a w zakresie danych szczególnych kategorii (np. zdrowotnych dla celów BHP) — na podstawie wyrażonej zgody, art. 9 ust. 2 lit. a RODO.",
      ],
    },
    {
      heading: "3. Kategorie przetwarzanych danych",
      paragraphs: [
        "Dane identyfikacyjne i kontaktowe (imię, nazwisko, PESEL, numer dokumentu tożsamości, adres, telefon, e-mail), dane dotyczące wykonywanego zlecenia/zatrudnienia (stanowisko, wynagrodzenie, dane bankowe, ewidencja godzin), a w przypadku osób niebędących obywatelami Polski — dane dotyczące statusu pobytowego i podstawy wykonywania pracy.",
      ],
    },
    {
      heading: "4. Odbiorcy danych",
      paragraphs: [
        "Dane mogą być udostępniane uprawnionym pracownikom i współpracownikom administratora, organom administracji publicznej w zakresie wymaganym przepisami prawa (w tym ZUS, urzędom skarbowym, Państwowej Inspekcji Pracy, urzędom wojewódzkim), a także podmiotom świadczącym usługi IT, księgowe i archiwizacyjne na podstawie umów powierzenia przetwarzania danych.",
      ],
    },
    {
      heading: "5. Okres przechowywania danych",
      paragraphs: [
        "Dane będą przechowywane przez okres obowiązywania umowy oraz dodatkowo przez okres wymagany przepisami prawa, w tym przepisami podatkowymi i o ubezpieczeniach społecznych (zwykle od 3 do 50 lat, w zależności od kategorii dokumentacji), a w pozostałym zakresie — przez okres niezbędny do realizacji celów przetwarzania.",
      ],
    },
    {
      heading: "6. Prawa osoby, której dane dotyczą",
      paragraphs: [
        "Przysługuje Pani/Panu prawo dostępu do danych i otrzymania ich kopii, prawo do sprostowania danych, prawo do usunięcia danych (w granicach przewidzianych prawem), prawo do ograniczenia przetwarzania, prawo do przenoszenia danych, prawo do wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie administratora oraz prawo do wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa). W zakresie danych przetwarzanych na podstawie zgody — prawo do jej wycofania w każdym czasie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed wycofaniem.",
      ],
    },
    {
      heading: "7. Informacja o wymogu podania danych",
      paragraphs: [
        "Podanie danych osobowych w zakresie niezbędnym do zawarcia i wykonania umowy jest wymogiem umownym i ustawowym. Odmowa ich podania uniemożliwi zawarcie lub wykonanie umowy.",
        "Oświadczam, że zapoznałem/am się z treścią niniejszej klauzuli informacyjnej oraz wyrażam zgodę na przetwarzanie moich danych osobowych w zakresie wykraczającym poza obowiązki prawne administratora, jeżeli takie przetwarzanie ma miejsce.",
      ],
    },
  ],
});

export const generateOswiadczenieWyplata = (contract: ContractInput): GeneratedDocument => ({
  id: "oswiadczenie_wyplata",
  title: "Oświadczenie o sposobie wypłaty wynagrodzenia",
  legalBasis: LEGAL_2026.legalBases.umowaOPrace,
  signature: "employee",
  sections: [
    {
      paragraphs: [
        "Niniejszym oświadczam, że wynagrodzenie należne mi z tytułu wykonywania niniejszej umowy powinno być przekazywane w następujący sposób:",
      ],
      fields: [
        { label: "Sposób wypłaty", value: contract.paymentMethod || "przelewem" },
        { label: "Nazwa banku", value: DASH },
        { label: "Numer rachunku bankowego (IBAN)", value: DASH },
      ],
    },
    {
      paragraphs: [
        "Oświadczam, że podany powyżej numer rachunku bankowego jest poprawny i należy do mnie, oraz przyjmuję do wiadomości, że odpowiadam za skutki podania nieprawidłowych danych, w tym za koszty i opóźnienia wynikające z błędnego przelewu.",
        "Zobowiązuję się do niezwłocznego, pisemnego poinformowania administratora o każdej zmianie wskazanego rachunku bankowego.",
      ],
    },
  ],
});

export const generateForeignerChecklist = (
  employee: EmployeeContractData,
): GeneratedDocument => ({
  id: "foreigner_checklist",
  title: "Załącznik — Checklist zatrudnienia cudzoziemca",
  legalBasis: LEGAL_2026.legalBases.foreigner,
  signature: "two-party",
  sections: [
    {
      fields: [
        { label: "Pracownik / Zleceniobiorca", value: fullName(employee) },
        { label: "Obywatelstwo", value: employee.citizenship || DASH },
        { label: "Typ dokumentu pobytowego", value: employee.foreignerDocumentType || DASH },
        { label: "Numer dokumentu", value: employee.foreignerDocumentNumber || DASH },
        { label: "Data ważności dokumentu", value: employee.foreignerDocumentExpiry || DASH },
        { label: "Podstawa wykonywania pracy", value: employee.workBasis || DASH },
      ],
    },
    {
      heading: "Dokumenty wymagane przed dopuszczeniem do pracy",
      paragraphs: [
        "1. Paszport lub inny dokument potwierdzający tożsamość i obywatelstwo — kopia przechowywana w dokumentacji osobowej.",
        "2. Wiza, karta pobytu lub inny dokument potwierdzający legalność pobytu na terytorium Rzeczypospolitej Polskiej — kopia z potwierdzoną datą ważności.",
        "3. Zezwolenie na pracę (typ A, B, C, D lub E w zależności od podstawy), oświadczenie o powierzeniu wykonywania pracy zarejestrowane w powiatowym urzędzie pracy, lub inna podstawa prawna do legalnego wykonywania pracy w Polsce — kopia obowiązkowa.",
        "4. Pisemne oświadczenie cudzoziemca potwierdzające, że posiada on legalne prawo do wykonywania pracy na terytorium Polski oraz że poinformuje Zleceniodawcę/Pracodawcę o każdej zmianie tego statusu.",
      ],
    },
    {
      heading: "Obowiązki pracodawcy / zleceniodawcy",
      paragraphs: [
        "1. Zawiadomienie właściwego ze względu na siedzibę pracodawcy urzędu wojewódzkiego (Wydział Spraw Obywatelskich i Cudzoziemców) o podjęciu pracy przez cudzoziemca albo o niepodjęciu przez niego pracy — w terminie 7 dni od dnia rozpoczęcia (lub planowanego rozpoczęcia) pracy.",
        "2. Zawiadomienie właściwego urzędu wojewódzkiego o przerwaniu wykonywania pracy przez cudzoziemca — w terminie 7 dni od dnia przerwania.",
        "3. Bieżące monitorowanie terminu ważności wizy, karty pobytu lub zezwolenia na pracę oraz niedopuszczenie do wykonywania pracy po utracie podstawy legalnego pobytu lub zatrudnienia.",
        "4. Przechowywanie kopii dokumentów uprawniających do pobytu i pracy przez cały okres trwania umowy oraz przez okres wymagany przepisami o przechowywaniu dokumentacji pracowniczej.",
        "5. Bieżące śledzenie zmian przepisów dotyczących zatrudniania cudzoziemców na stronach urzędowych (gov.pl, stronie właściwego urzędu wojewódzkiego), ponieważ przepisy w tym zakresie ulegają częstym zmianom.",
      ],
    },
  ],
});
