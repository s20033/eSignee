import { LEGAL_2026 } from "./constants";

export type JobPosition = {
  id: string;
  namePl: string;
  nameEn: string;
  occupationCode: string;
  workplace: string;
  fullDescription: string;
  minHourlyRate: number;
};

/**
 * Common warehouse/logistics occupations, ported from the legacy job-positions
 * registry. A convenience picker in the Contract Builder — employers can still
 * type a free-text position on the employee record.
 */
export const JOB_POSITIONS: JobPosition[] = [
  {
    id: "warehouse_worker",
    namePl: "Pracownik magazynowy",
    nameEn: "Warehouse Worker",
    occupationCode: "932911",
    workplace: "Lublin lub inne lokalizacje wskazane przez Zleceniodawcę",
    fullDescription:
      "Pracownik magazynowy odpowiada za przyjmowanie, wydawanie i kompletację towarów, pakowanie przesyłek, obsługę skanerów kodów oraz utrzymanie porządku i czystości w magazynie, zgodnie z procedurami BHP.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "forklift_operator",
    namePl: "Operator wózka widłowego",
    nameEn: "Forklift Operator",
    occupationCode: "832101",
    workplace: "Lublin lub inne lokalizacje",
    fullDescription:
      "Operator wózka widłowego odpowiada za bezpieczną obsługę wózka widłowego, ładowanie i rozładowanie pojazdów dostawczych oraz transport towarów wewnątrz magazynu, posiadając aktualne uprawnienia UDT.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "logistics_coordinator",
    namePl: "Koordynator logistyki",
    nameEn: "Logistics Coordinator",
    occupationCode: "521101",
    workplace: "Lublin",
    fullDescription:
      "Koordynator logistyki planuje i nadzoruje harmonogramy dostaw, koordynuje współpracę ze zleceniodawcami i przewoźnikami oraz przygotowuje dokumentację transportową i magazynową.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "order_picker",
    namePl: "Kompletator zamówień",
    nameEn: "Order Picker",
    occupationCode: "932912",
    workplace: "Lublin lub inne lokalizacje wskazane przez Zleceniodawcę",
    fullDescription:
      "Kompletator zamówień odpowiada za precyzyjne kompletowanie zamówień na podstawie list pickingowych, kontrolę zgodności ilościowej i jakościowej oraz przygotowanie towaru do wysyłki.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "quality_control_inspector",
    namePl: "Kontroler jakości",
    nameEn: "Quality Control Inspector",
    occupationCode: "753303",
    workplace: "Lublin",
    fullDescription:
      "Kontroler jakości weryfikuje zgodność przyjmowanych i wysyłanych towarów ze specyfikacją, dokumentuje niezgodności oraz zgłasza odchylenia od standardów jakości.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "production_worker_plastics",
    namePl: "Pracownik produkcji (linia produkcji rur z tworzyw sztucznych)",
    nameEn: "Production Worker (plastic tubes production line)",
    occupationCode: "813204",
    workplace: "Lublin lub inne lokalizacje wskazane przez Zleceniodawcę",
    fullDescription:
      "Pracownik produkcji obsługuje linię produkcyjną rur z tworzyw sztucznych, kontroluje parametry procesu i jakość wyrobów, dokonuje pakowania gotowych produktów oraz utrzymuje porządek na stanowisku pracy.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "machine_operator",
    namePl: "Operator maszyn produkcyjnych",
    nameEn: "Machine Operator",
    occupationCode: "818990",
    workplace: "Lublin lub inne lokalizacje wskazane przez Zleceniodawcę",
    fullDescription:
      "Operator maszyn produkcyjnych obsługuje i nadzoruje pracę maszyn, ustawia parametry produkcji, monitoruje jakość procesu oraz zgłasza usterki techniczne.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
  {
    id: "delivery_driver",
    namePl: "Kierowca dostawczy",
    nameEn: "Delivery Driver",
    occupationCode: "832203",
    workplace: "Lublin i okolice / trasy wskazane przez Zleceniodawcę",
    fullDescription:
      "Kierowca dostawczy realizuje dostawy towarów na wskazanych trasach, obsługuje dokumenty przewozowe (listy przewozowe, potwierdzenia odbioru), dba o stan techniczny i czystość pojazdu oraz przestrzega przepisów ruchu drogowego i czasu pracy kierowców.",
    minHourlyRate: LEGAL_2026.minHourlyRateZlecenieGrossPln,
  },
];

export const getJobPositionById = (id: string): JobPosition | null =>
  JOB_POSITIONS.find((position) => position.id === id) ?? null;
