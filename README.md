# Oro baliono masės rezervas

Oro baliono keliamosios galios ir bendro svorio skaičiuoklė (pagal Sauliaus Jezepčiko Excel lentelę).

**Adresas:** `https://<github-vartotojas>.github.io/Danieliaus/`

## Skaičiavimas

Keliamoji jėga (kg) = V(ft³) × 0,0283168 × P(hPa) / 2,87 × (1/T_oro − 1/T_kupolo), kur T kelvinais.

Bendras svoris = kupolas + krepšys + degikliai + kuro talpos + papildoma įranga + visa įgula.

Atsarga = keliamoji jėga − bendras svoris (turi būti teigiama).

Jei balionui nurodyta **minimali nusileidimo masė** ir bendras svoris už ją mažesnis
(per didelis rezervas), rezultatas rodomas raudonai su užrašu „per mažas svoris“ ir parodoma, kiek trūksta.

## Kaip pridėti ar pašalinti balioną

### Puslapyje (tik savo įrenginyje)

Skiltyje **Oro balionas → Tvarkyti balionus**:

- sąraše **Pasirinkite balioną redagavimui** pasirinkite balioną – jo duomenys atsiras formoje; pakeiskite (pvz. įrašykite minimalią nusileidimo masę) ir spauskite **Išsaugoti pakeitimus**;
- pasirinkus **+ Naujas balionas**, forma išvaloma naujam balionui;
- **Pašalinti šį balioną** arba **✕** sąraše „Visi balionai“ pašalina balioną (**✎** – atidaro redagavimui);
- **Atkurti pašalintus iš failo** grąžina pašalintus balionus iš `balionai.js`.

Šie pakeitimai išsaugomi tik tame telefone ar kompiuteryje.

### Visiems naudotojams (GitHub'e)

1. Puslapyje susitvarkykite balionų sąrašą ir paspauskite **Kopijuoti sąrašą failui balionai.js**.
2. GitHub'e atidarykite `balionai.js` → ✏️ (Edit) → pažymėkite visą tekstą (Ctrl+A) → įklijuokite (Ctrl+V).
3. Paspauskite **Commit changes**. Svetainė atsinaujins per 1–2 min.

Galima ir rankiniu būdu: `balionai.js` faile nukopijuokite vieną `{ ... }` bloką, pakeiskite reikšmes ir tarp blokų palikite kablelį.

Pakeitus kitus failus, `sw.js` faile padidinkite `CACHE` versiją (pvz. `v1` → `v2`), kad telefonai gautų naujus failus.

## Pilotai

Pilotų vardai ir svoriai **nesaugomi šioje repozitorijoje**, nes GitHub Pages svetainė yra vieša.
Įveskite pilotą ir paspauskite ★ – jis bus įsimintas tik tame telefone ar kompiuteryje.

---

Tai tik planavimo įrankis – jis nepakeičia gamintojo skrydžio vadovo apkrovos lentelių.
