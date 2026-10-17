(function () {
  "use strict";

  const FT3_I_M3 = 0.0283168;
  const BUSENOS_RAKTAS = "oroBalionas.busena.v1";
  const PILOTU_RAKTAS = "oroBalionas.pilotai.v1";

  const $ = (id) => document.getElementById(id);

  // --- Saugykla (gali būti neprieinama privačiame režime) ---
  function skaityti(raktas, numatyta) {
    try {
      const v = localStorage.getItem(raktas);
      return v ? JSON.parse(v) : numatyta;
    } catch (e) {
      return numatyta;
    }
  }
  function rasyti(raktas, reiksme) {
    try {
      localStorage.setItem(raktas, JSON.stringify(reiksme));
    } catch (e) { /* ignoruojama */ }
  }

  function skaicius(el) {
    const raw = String(el.value).replace(",", ".").trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function kg(n, skaitmenys) {
    if (n === null || !Number.isFinite(n)) return "–";
    const d = skaitmenys === undefined ? (Number.isInteger(n) ? 0 : 1) : skaitmenys;
    return n.toLocaleString("lt-LT", { minimumFractionDigits: d, maximumFractionDigits: d }) + " kg";
  }

  // --- Fizika ---
  // Keliamoji jėga (kg) = V(m³) · ρ_oro·T · (1/T_oro − 1/T_kupolo),
  // kur ρ·T = P / R, o P(hPa)/2,87 = P(Pa)/287 (sauso oro dujų konstanta).
  function keliamojiJega(turisFt3, slegisHpa, oroTempC, kupoloTempC) {
    const v = turisFt3 * FT3_I_M3;
    const ta = oroTempC + 273.15;
    const te = kupoloTempC + 273.15;
    return v * (slegisHpa / 2.87) * (1 / ta - 1 / te);
  }

  // Tarptautinė standartinė atmosfera: slėgis ir temperatūra aukštyje (ft),
  // kai QNH ir temperatūra žinomi jūros lygyje.
  function isaAukstyje(qnh, tempC, aukstisFt) {
    const h = Math.max(0, aukstisFt || 0);
    return {
      slegis: qnh * Math.pow(1 - 6.8756e-6 * h, 5.2559),
      temp: tempC - 1.98 * (h / 1000)
    };
  }

  // --- Balionų sąrašas ---
  const balionoSelect = $("balionas");
  BALIONAI.forEach((b, i) => {
    const o = document.createElement("option");
    o.value = b.registracija;
    o.textContent = b.registracija + " · " + b.tipas;
    balionoSelect.appendChild(o);
  });

  function pasirinktasBalionas() {
    return BALIONAI.find((b) => b.registracija === balionoSelect.value) || null;
  }

  function rodytiBalionoDuomenis(b) {
    const dl = $("balionoDuomenys");
    dl.innerHTML = "";
    if (!b) return;
    const eil = [
      ["Tipas", b.tipas],
      ["Tūris", b.turisFt3.toLocaleString("lt-LT") + " ft³"],
      ["Kupolas", kg(b.kupolasKg)],
      ["Krepšys", kg(b.krepsysKg)],
      ["Degikliai", kg(b.degikliaiKg)]
    ];
    if (b.mtomKg) eil.push(["MTOM", kg(b.mtomKg)]);
    eil.forEach(([k, v]) => {
      const div = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = k;
      dd.textContent = v;
      div.append(dt, dd);
      dl.appendChild(div);
    });
  }

  // --- Įsiminti pilotai ---
  let pilotai = skaityti(PILOTU_RAKTAS, []);

  function atnaujintiPilotus() {
    const dl = $("pilotai");
    const ul = $("pilotuSarasas");
    dl.innerHTML = "";
    ul.innerHTML = "";
    pilotai.forEach((p, i) => {
      const o = document.createElement("option");
      o.value = p.vardas;
      dl.appendChild(o);

      const li = document.createElement("li");
      const t = document.createElement("span");
      t.textContent = p.vardas + " — " + kg(p.svoris);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.textContent = "✕";
      del.title = "Pamiršti";
      del.setAttribute("aria-label", "Pamiršti " + p.vardas);
      del.addEventListener("click", () => {
        pilotai.splice(i, 1);
        rasyti(PILOTU_RAKTAS, pilotai);
        atnaujintiPilotus();
      });
      li.append(t, del);
      ul.appendChild(li);
    });
    $("issaugotiPilotai").hidden = pilotai.length === 0;
  }

  $("pilotoVardas").addEventListener("input", () => {
    const vardas = $("pilotoVardas").value.trim().toLowerCase();
    const p = pilotai.find((x) => x.vardas.toLowerCase() === vardas);
    if (p) $("pilotoSvoris").value = p.svoris;
    skaiciuoti();
  });

  $("issaugotiPilota").addEventListener("click", () => {
    const vardas = $("pilotoVardas").value.trim();
    const svoris = skaicius($("pilotoSvoris"));
    if (!vardas || svoris === null) {
      alert("Įveskite piloto vardą ir svorį.");
      return;
    }
    const esamas = pilotai.find((x) => x.vardas.toLowerCase() === vardas.toLowerCase());
    if (esamas) esamas.svoris = svoris;
    else pilotai.push({ vardas, svoris });
    pilotai.sort((a, b) => a.vardas.localeCompare(b.vardas, "lt"));
    rasyti(PILOTU_RAKTAS, pilotai);
    atnaujintiPilotus();
    $("issaugotiPilotai").open = true;
  });

  // --- Keleiviai ---
  const keleiviaiEl = $("keleiviai");
  const sablonas = $("keleivioSablonas");

  function pridetiKeleivi(vardas, svoris) {
    const eil = sablonas.content.firstElementChild.cloneNode(true);
    eil.querySelector(".k-vardas").value = vardas || "";
    eil.querySelector(".k-svoris").value = svoris === undefined || svoris === null ? "" : svoris;
    eil.querySelector(".k-salinti").addEventListener("click", () => {
      eil.remove();
      skaiciuoti();
    });
    keleiviaiEl.appendChild(eil);
    return eil;
  }

  $("pridetiKeleivi").addEventListener("click", () => {
    const eil = pridetiKeleivi();
    eil.querySelector(".k-svoris").focus();
    skaiciuoti();
  });

  // --- Skaičiavimas ---
  const ivestys = ["temp", "qnh", "kupoloTemp", "aukstis", "talpuKiekis", "talposSvoris", "iranga", "pilotoSvoris"];

  function skaiciuoti() {
    const b = pasirinktasBalionas();
    rodytiBalionoDuomenis(b);

    const ispejimai = [];

    const piloto = skaicius($("pilotoSvoris"));
    if (piloto === null) ispejimai.push("Neįvestas piloto svoris.");
    let igula = piloto || 0;
    keleiviaiEl.querySelectorAll(".crew-row").forEach((r, i) => {
      const s = skaicius(r.querySelector(".k-svoris"));
      if (s === null) ispejimai.push("Neįvestas " + (i + 1) + "-ojo keleivio svoris.");
      igula += s || 0;
    });
    $("igulaViso").textContent = kg(igula);

    const talpos = (skaicius($("talpuKiekis")) || 0) * (skaicius($("talposSvoris")) || 0);
    const iranga = skaicius($("iranga")) || 0;

    const eilutes = b
      ? [
          ["Kupolas", b.kupolasKg],
          ["Krepšys", b.krepsysKg],
          ["Degikliai", b.degikliaiKg],
          ["Kuro talpos (" + (skaicius($("talpuKiekis")) || 0) + " vnt., pilnos)", talpos],
          ["Papildoma įranga", iranga],
          ["Skrydžio įgula", igula]
        ]
      : [];
    const bendras = eilutes.reduce((s, e) => s + e[1], 0);

    const tbody = $("svoriai");
    tbody.innerHTML = "";
    eilutes.forEach(([k, v]) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      const td = document.createElement("td");
      th.textContent = k;
      td.textContent = kg(v);
      tr.append(th, td);
      tbody.appendChild(tr);
    });

    const temp = skaicius($("temp"));
    const qnh = skaicius($("qnh"));
    const kupoloTemp = skaicius($("kupoloTemp"));
    const aukstis = skaicius($("aukstis")) || 0;

    let jega = null;
    if (b && temp !== null && qnh !== null && kupoloTemp !== null) {
      const atm = isaAukstyje(qnh, temp, aukstis);
      if (kupoloTemp <= atm.temp) {
        ispejimai.push("Kupolo temperatūra turi būti aukštesnė už oro temperatūrą.");
      } else {
        jega = Math.round(keliamojiJega(b.turisFt3, atm.slegis, atm.temp, kupoloTemp));
      }
      if (aukstis > 0) {
        ispejimai.push(
          "Aukštyje " + aukstis.toLocaleString("lt-LT") + " ft: " +
          atm.temp.toLocaleString("lt-LT", { maximumFractionDigits: 1 }) + " °C, " +
          Math.round(atm.slegis) + " hPa (ISA)."
        );
      }
    } else if (b) {
      ispejimai.push("Įveskite temperatūrą, QNH ir kupolo temperatūrą.");
    }
    if (kupoloTemp !== null && kupoloTemp > 120) {
      ispejimai.push("Kupolo temperatūra viršija 120 °C – patikrinkite skrydžio vadove nurodytą ribą.");
    }
    if (b && b.mtomKg && bendras > b.mtomKg) {
      ispejimai.push("Bendras svoris " + kg(bendras) + " viršija MTOM " + kg(b.mtomKg) + ".");
    }

    const skirtumas = jega === null ? null : jega - bendras;

    $("keliamoji").textContent = kg(jega, 0);
    $("bendras").textContent = kg(bendras);
    $("skirtumas").textContent = skirtumas === null ? "–" : (skirtumas > 0 ? "+" : "") + kg(skirtumas);

    const busena = skirtumas === null ? "" : skirtumas > 0 ? "ok" : "bad";
    $("rezultatas").dataset.state = busena;
    $("statusBar").dataset.state = busena;
    $("statusValue").textContent = $("skirtumas").textContent;

    const ul = $("ispejimai");
    ul.innerHTML = "";
    ispejimai.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });

    issaugotiBusena();
  }

  // --- Paskutinių įvesčių išsaugojimas ---
  function issaugotiBusena() {
    const b = { balionas: balionoSelect.value, pilotoVardas: $("pilotoVardas").value, keleiviai: [] };
    ivestys.forEach((id) => (b[id] = $(id).value));
    keleiviaiEl.querySelectorAll(".crew-row").forEach((r) => {
      b.keleiviai.push({
        vardas: r.querySelector(".k-vardas").value,
        svoris: r.querySelector(".k-svoris").value
      });
    });
    rasyti(BUSENOS_RAKTAS, b);
  }

  function atkurtiBusena() {
    const b = skaityti(BUSENOS_RAKTAS, null);
    if (!b) {
      balionoSelect.value = BALIONAI.length > 1 ? BALIONAI[1].registracija : (BALIONAI[0] || {}).registracija;
      return;
    }
    if (BALIONAI.some((x) => x.registracija === b.balionas)) balionoSelect.value = b.balionas;
    ivestys.forEach((id) => {
      if (b[id] !== undefined) $(id).value = b[id];
    });
    $("pilotoVardas").value = b.pilotoVardas || "";
    (b.keleiviai || []).forEach((k) => pridetiKeleivi(k.vardas, k.svoris));
  }

  // --- Įvykiai ---
  document.querySelector("main").addEventListener("input", (e) => {
    if (e.target.id !== "pilotoVardas") skaiciuoti();
  });
  balionoSelect.addEventListener("change", skaiciuoti);

  atnaujintiPilotus();
  atkurtiBusena();
  skaiciuoti();

  // Veikimas be interneto (tik per https / localhost)
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
