export type WojewodaOffice = {
  name: string;
  address: string;
};

/**
 * Voivodeship-office Foreigners Affairs departments — used by the foreigner
 * checklist to point the employer to the correct office for statutory
 * work-notification duties.
 */
export const WOJEWODA_OFFICES: WojewodaOffice[] = [
  { name: "Dolnośląski Urząd Wojewódzki", address: "pl. Powstańców Warszawy 1, 50-153 Wrocław" },
  { name: "Kujawsko-Pomorski Urząd Wojewódzki", address: "ul. Jagiellońska 3, 85-950 Bydgoszcz" },
  { name: "Lubelski Urząd Wojewódzki", address: "ul. Spokojna 4, 20-914 Lublin" },
  { name: "Lubuski Urząd Wojewódzki", address: "ul. Jagiellońska 8, 65-064 Zielona Góra" },
  { name: "Łódzki Urząd Wojewódzki", address: "ul. Piotrkowska 104, 90-926 Łódź" },
  { name: "Małopolski Urząd Wojewódzki", address: "ul. Basztowa 22, 31-156 Kraków" },
  { name: "Mazowiecki Urząd Wojewódzki", address: "pl. Bankowy 3/5, 00-950 Warszawa" },
  { name: "Opolski Urząd Wojewódzki", address: "ul. Piastowska 14, 45-082 Opole" },
  { name: "Podkarpacki Urząd Wojewódzki", address: "ul. Grunwaldzka 15, 35-959 Rzeszów" },
  { name: "Podlaski Urząd Wojewódzki", address: "ul. Mickiewicza 3, 15-213 Białystok" },
  { name: "Pomorski Urząd Wojewódzki", address: "ul. Okopowa 21/27, 80-810 Gdańsk" },
  { name: "Śląski Urząd Wojewódzki", address: "ul. Jagiellońska 25, 40-032 Katowice" },
  { name: "Świętokrzyski Urząd Wojewódzki", address: "al. IX Wieków Kielc 3, 25-516 Kielce" },
  {
    name: "Warmińsko-Mazurski Urząd Wojewódzki",
    address: "al. Marszałka Józefa Piłsudskiego 7/9, 10-575 Olsztyn",
  },
  { name: "Wielkopolski Urząd Wojewódzki", address: "al. Niepodległości 16/18, 61-713 Poznań" },
  { name: "Zachodniopomorski Urząd Wojewódzki", address: "ul. Wały Chrobrego 4, 70-502 Szczecin" },
];
