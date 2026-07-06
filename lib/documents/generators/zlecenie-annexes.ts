import { LEGAL_2026 } from "@/lib/legal/constants";
import { DASH } from "../helpers";
import type { GeneratedDocument } from "../types";

export const generateZalacznikEwidencjaGodzin = (): GeneratedDocument => ({
  id: "zalacznik_1_ewidencja_godzin",
  title: "Załącznik nr 1 — Ewidencja godzin wykonywania zlecenia",
  legalBasis: LEGAL_2026.legalBases.hoursEvidence,
  signature: "employee",
  sections: [
    {
      paragraphs: [
        "Zgodnie z art. 8b ustawy z dnia 10 października 2002 r. o minimalnym wynagrodzeniu za pracę, Zleceniodawca jest obowiązany potwierdzać liczbę godzin wykonania zlecenia, a sposób potwierdzania tej liczby godzin Strony określają w niniejszym Załączniku.",
        "Ewidencję prowadzi Zleceniobiorca na bieżąco, a Zleceniodawca potwierdza jej zgodność podpisem nie później niż przy wypłacie wynagrodzenia za dany okres rozliczeniowy. Ewidencja jest przechowywana przez Zleceniodawcę przez okres 3 lat od dnia, w którym wynagrodzenie stało się należne, zgodnie z obowiązkiem dokumentacyjnym wynikającym z ww. ustawy.",
        "Tabela poniżej stanowi wzór do wypełnienia ręcznego lub elektronicznego dla każdego okresu rozliczeniowego.",
      ],
      fields: [
        { label: "Miesiąc / okres rozliczeniowy", value: DASH },
        { label: "Data", value: DASH },
        { label: "Liczba godzin wykonywania zlecenia", value: DASH },
        { label: "Podpis Zleceniobiorcy", value: DASH },
        { label: "Potwierdzenie Zleceniodawcy", value: DASH },
      ],
    },
  ],
});

export const generateZalacznikProtokolSprzetu = (): GeneratedDocument => ({
  id: "zalacznik_3_protokol_sprzetu",
  title: "Załącznik nr 3 — Protokół przekazania i zwrotu sprzętu",
  legalBasis: LEGAL_2026.legalBases.bhp,
  signature: "two-party",
  sections: [
    {
      paragraphs: [
        "Niniejszy protokół dokumentuje przekazanie Zleceniobiorcy przez Zleceniodawcę sprzętu, narzędzi i odzieży ochronnej niezbędnych do wykonania zlecenia, a po zakończeniu Umowy — ich zwrot.",
        "Zleceniobiorca potwierdza odbiór sprzętu w stanie technicznym umożliwiającym jego prawidłowe użytkowanie oraz zobowiązuje się do używania go zgodnie z przeznaczeniem i instrukcjami obsługi, a także do niezwłocznego zgłaszania Zleceniodawcy wszelkich usterek.",
        "W przypadku utraty lub uszkodzenia sprzętu z winy Zleceniobiorcy, wykraczającego poza normalne zużycie, Zleceniobiorca może zostać obciążony kosztami naprawy lub odkupienia sprzętu, zgodnie z zasadami odpowiedzialności określonymi w §6 Umowy.",
      ],
      fields: [
        { label: "Wykaz przekazanego sprzętu / narzędzi", value: DASH },
        { label: "Numer inwentarzowy / seryjny", value: DASH },
        { label: "Stan techniczny przy przekazaniu", value: DASH },
        { label: "Data przekazania", value: DASH },
        { label: "Stan techniczny przy zwrocie", value: DASH },
        { label: "Data zwrotu", value: DASH },
      ],
    },
  ],
});

export const generateZalacznikKontrolaTrzezwosci = (): GeneratedDocument => ({
  id: "zalacznik_4_kontrola_trzezwosci",
  title: "Załącznik nr 4 — Zasady kontroli trzeźwości",
  legalBasis: LEGAL_2026.legalBases.bhp,
  signature: "employee",
  sections: [
    {
      paragraphs: [
        "Na podstawie przepisów Kodeksu pracy dotyczących kontroli trzeźwości pracowników i osób świadczących pracę na innej podstawie niż stosunek pracy, Zleceniodawca wprowadza niniejsze zasady w celu zapewnienia bezpieczeństwa wykonywania zlecenia.",
        "Zleceniobiorca zobowiązuje się do wykonywania zlecenia w stanie pełnej trzeźwości oraz w stanie niewskazującym na spożycie alkoholu, środków odurzających, substancji psychotropowych lub nowych substancji psychoaktywnych.",
        "Zleceniobiorca wyraża zgodę na przeprowadzanie przez upoważnione osoby ze strony Zleceniodawcy kontroli trzeźwości przy użyciu metod niewymagających badania laboratoryjnego (np. alkomatu), zgodnie z wewnętrznymi procedurami Zleceniodawcy oraz obowiązującymi przepisami prawa.",
        "Stwierdzenie obecności alkoholu lub środków odurzających uprawnia Zleceniodawcę do niedopuszczenia Zleceniobiorcy do wykonywania czynności w danym dniu oraz może stanowić podstawę do rozwiązania Umowy bez zachowania okresu wypowiedzenia, na zasadach określonych w §7 ust. 7.3 Umowy.",
      ],
    },
  ],
});
