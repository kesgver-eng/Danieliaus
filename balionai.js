// Oro balionų duomenys (iš „Mases Rezervas.xlsx“ lapo INFO).
// Norėdami pridėti balioną, nukopijuokite vieną { ... } bloką, įklijuokite
// po paskutiniu (nepamirškite kablelio tarp blokų) ir pakeiskite reikšmes.
//
//   registracija – registracijos ženklas
//   tipas        – baliono tipas / modelis
//   turisFt3     – kupolo tūris, ft³
//   kupolasKg    – kupolo svoris, kg
//   krepsysKg    – krepšio svoris, kg
//   degikliaiKg  – degiklių svoris, kg
//   mtomKg       – maksimali kilimo masė iš skrydžio vadovo, kg
//                  (null – netikrinama)
//   minNusileidimoKg – minimali leistina nusileidimo masė, kg
//                  (null – netikrinama)

const BALIONAI = [
  {
    registracija: "LY-MIN",
    tipas: "BB17GP",
    turisFt3: 60030,
    kupolasKg: 75,
    krepsysKg: 51,
    degikliaiKg: 24,
    mtomKg: null,
    minNusileidimoKg: null
  },
  {
    registracija: "LY-MBU",
    tipas: "BB22XR",
    turisFt3: 77040,
    kupolasKg: 105,
    krepsysKg: 60,
    degikliaiKg: 22,
    mtomKg: null,
    minNusileidimoKg: null
  }
];
