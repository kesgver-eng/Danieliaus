(function () {
  "use strict";

  const FT3_I_M3 = 0.0283168;
  const BUSENOS_RAKTAS = "oroBalionas.busena.v1";
  const PILOTU_RAKTAS = "oroBalionas.pilotai.v1";
  const BALIONU_RAKTAS = "oroBalionas.balionai.v1";

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

  function nurodyta(v) {
    return v !== null && v !== undefined && Number.isFinite(v);
  }

  // Jei anksčiau įrenginyje pridėtam balionui šie laukai neįvesti,
  // naudojamos Excel lentelės reikšmės (ir rodomas įspėjimas).
  const NUMATYTAS_TALPU_KIEKIS = 3;
  const NUMATYTA_TALPA_KG = 35;
  const NUMATYTA_IRANGA_KG = 15;

  function kurasIrIranga(b) {
    const r = {
      kiekis: nurodyta(b.talpuKiekis) ? b.talpuKiekis : NUMATYTAS_TALPU_KIEKIS,
      talposKg: nurodyta(b.talposKg) ? b.talposKg : NUMATYTA_TALPA_KG,
      iranga: nurodyta(b.irangaKg) ? b.irangaKg : NUMATYTA_IRANGA_KG,
      neivesta: !nurodyta(b.talpuKiekis) || !nurodyta(b.talposKg) || !nurodyta(b.irangaKg)
    };
    r.talpos = r.kiekis * r.talposKg;
    return r;
  }

  // --- Balionų sąrašas ---
  // Balionai iš balionai.js + šiame įrenginyje pridėti, atėmus paslėptus.
  // Pridėtas balionas su ta pačia registracija pakeičia esantį faile.
  const balionoSelect = $("balionas");
  const vartotojo = skaityti(BALIONU_RAKTAS, { pridedami: [], paslepti: [] });

  function visiBalionai() {
    const savas = (reg) => vartotojo.pridedami.find((b) => b.registracija === reg);
    const isFailo = BALIONAI
      .filter((b) => !vartotojo.paslepti.includes(b.registracija) || savas(b.registracija))
      .map((b) => savas(b.registracija)
        ? Object.assign({ savas: true }, savas(b.registracija))
        : Object.assign({ savas: false }, b));
    const nauji = vartotojo.pridedami
      .filter((b) => !BALIONAI.some((x) => x.registracija === b.registracija))
      .map((b) => Object.assign({ savas: true }, b));
    return isFailo.concat(nauji);
  }

  function pasirinktasBalionas() {
    return visiBalionai().find((b) => b.registracija === balionoSelect.value) || null;
  }

  function issaugotiBalionus() {
    rasyti(BALIONU_RAKTAS, vartotojo);
  }

  function atnaujintiBalionus(pasirinkti) {
    const visi = visiBalionai();
    const norimas = pasirinkti !== undefined ? pasirinkti : balionoSelect.value;

    balionoSelect.innerHTML = "";
    visi.forEach((b) => {
      const o = document.createElement("option");
      o.value = b.registracija;
      o.textContent = balionoPavadinimas(b);
      balionoSelect.appendChild(o);
    });
    if (visi.some((b) => b.registracija === norimas)) balionoSelect.value = norimas;
    balionoSelect.disabled = visi.length === 0;

    // Redagavimo sąrašas: „Naujas balionas“ + visi esami
    const ed = $("redaguojamasBalionas");
    ed.innerHTML = "";
    const naujas = document.createElement("option");
    naujas.value = "";
    naujas.textContent = "+ Naujas balionas";
    ed.appendChild(naujas);
    visi.forEach((b) => {
      const o = document.createElement("option");
      o.value = b.registracija;
      o.textContent = balionoPavadinimas(b);
      ed.appendChild(o);
    });
    ed.value = redaguojamas && visi.some((b) => b.registracija === redaguojamas) ? redaguojamas : "";

    const ul = $("balionuSarasas");
    ul.innerHTML = "";
    visi.forEach((b) => {
      const li = document.createElement("li");
      if (b.registracija === redaguojamas) li.className = "editing";
      const t = document.createElement("span");
      t.className = "balloon-name";
      const pav = document.createElement("strong");
      pav.textContent = b.registracija + " · " + b.tipas;
      t.appendChild(pav);
      if (b.savas) {
        const zym = document.createElement("small");
        zym.textContent = "šiame įrenginyje";
        t.appendChild(zym);
      }
      const det = document.createElement("span");
      det.className = "balloon-meta";
      const kur = kurasIrIranga(b);
      det.textContent = b.turisFt3.toLocaleString("lt-LT") + " ft³ · talpos " +
        kur.kiekis + " × " + kg(kur.talposKg) + " · įranga " + kg(kur.iranga) + " · min. nusileidimo " +
        (b.minNusileidimoKg ? kg(b.minNusileidimoKg) : "nenurodyta");
      t.appendChild(det);
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "icon-btn";
      edit.textContent = "✎";
      edit.title = "Redaguoti";
      edit.setAttribute("aria-label", "Redaguoti " + b.registracija);
      edit.addEventListener("click", () => redaguotiBalioną(b, true));
      const del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.textContent = "✕";
      del.title = "Pašalinti";
      del.setAttribute("aria-label", "Pašalinti " + b.registracija);
      del.addEventListener("click", () => pasalintiBalioną(b.registracija));
      const veiksmai = document.createElement("span");
      veiksmai.className = "actions";
      veiksmai.append(edit, del);
      li.append(t, veiksmai);
      ul.appendChild(li);
    });

    const paslepta = vartotojo.paslepti.filter((r) => BALIONAI.some((b) => b.registracija === r)).length;
    const atkurti = $("atkurtiBalionus");
    atkurti.hidden = paslepta === 0;
    atkurti.textContent = "Atkurti pašalintus iš failo (" + paslepta + ")";
  }

  function balionoPavadinimas(b) {
    return b.registracija + " · " + b.tipas +
      (b.minNusileidimoKg ? " · min. " + kg(b.minNusileidimoKg) : "");
  }

  function pasalintiBalioną(reg) {
    if (!confirm("Pašalinti balioną " + reg + "?")) return;
    vartotojo.pridedami = vartotojo.pridedami.filter((b) => b.registracija !== reg);
    if (BALIONAI.some((b) => b.registracija === reg) && !vartotojo.paslepti.includes(reg)) {
      vartotojo.paslepti.push(reg);
    }
    issaugotiBalionus();
    if (redaguojamas === reg) baigtiRedagavima();
    atnaujintiBalionus();
    skaiciuoti();
  }

  $("atkurtiBalionus").addEventListener("click", () => {
    vartotojo.paslepti = [];
    issaugotiBalionus();
    atnaujintiBalionus();
    skaiciuoti();
  });

  const BALIONO_LAUKAI = ["registracija", "tipas", "turisFt3", "kupolasKg", "krepsysKg", "degikliaiKg", "talpuKiekis", "talposKg", "irangaKg", "mtomKg", "minNusileidimoKg"];
  const forma = $("naujasBalionas");
  let redaguojamas = null;

  function redaguotiBalioną(b, slinkti) {
    redaguojamas = b.registracija;
    BALIONO_LAUKAI.forEach((k) => {
      forma.elements[k].value = b[k] === null || b[k] === undefined ? "" : b[k];
    });
    $("formosAntraste").textContent = "Redaguojamas " + b.registracija;
    $("formosMygtukas").textContent = "Išsaugoti pakeitimus";
    $("pasalintiRedaguojama").hidden = false;
    $("issaugota").hidden = true;
    atnaujintiBalionus();
    if (slinkti) forma.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function baigtiRedagavima() {
    redaguojamas = null;
    BALIONO_LAUKAI.forEach((k) => (forma.elements[k].value = ""));
    $("formosAntraste").textContent = "Naujas balionas";
    $("formosMygtukas").textContent = "+ Pridėti balioną";
    $("pasalintiRedaguojama").hidden = true;
    $("issaugota").hidden = true;
    $("redaguojamasBalionas").value = "";
  }

  $("redaguojamasBalionas").addEventListener("change", (e) => {
    const b = visiBalionai().find((x) => x.registracija === e.target.value);
    if (b) redaguotiBalioną(b);
    else {
      baigtiRedagavima();
      atnaujintiBalionus();
      forma.elements.registracija.focus();
    }
  });

  forma.addEventListener("input", () => ($("issaugota").hidden = true));

  $("pasalintiRedaguojama").addEventListener("click", () => {
    if (redaguojamas) pasalintiBalioną(redaguojamas);
  });

  // Atidarius „Tvarkyti balionus“, iškart rodomas šiuo metu pasirinktas balionas
  $("balionuTvarkymas").addEventListener("toggle", (e) => {
    if (!e.target.open) return;
    const b = pasirinktasBalionas();
    if (b && !redaguojamas) redaguotiBalioną(b);
  });

  forma.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = forma.elements;
    const sk = (el) => skaicius(el);
    const b = {
      registracija: f.registracija.value.trim().toUpperCase(),
      tipas: f.tipas.value.trim(),
      turisFt3: sk(f.turisFt3),
      kupolasKg: sk(f.kupolasKg),
      krepsysKg: sk(f.krepsysKg),
      degikliaiKg: sk(f.degikliaiKg),
      talpuKiekis: sk(f.talpuKiekis),
      talposKg: sk(f.talposKg),
      irangaKg: sk(f.irangaKg),
      mtomKg: sk(f.mtomKg),
      minNusileidimoKg: sk(f.minNusileidimoKg)
    };
    if (!b.registracija || !b.tipas || !b.turisFt3 || b.kupolasKg === null || b.krepsysKg === null ||
        b.degikliaiKg === null || b.talpuKiekis === null || b.talposKg === null || b.irangaKg === null) {
      alert("Užpildykite visus privalomus laukus (*).");
      return;
    }
    if (b.registracija !== redaguojamas &&
        visiBalionai().some((x) => x.registracija === b.registracija) &&
        !confirm("Balionas " + b.registracija + " jau yra. Pakeisti jo duomenis?")) {
      return;
    }
    // Redaguojant pakeitus registraciją, senasis įrašas pašalinamas
    if (redaguojamas && redaguojamas !== b.registracija) {
      vartotojo.pridedami = vartotojo.pridedami.filter((x) => x.registracija !== redaguojamas);
      if (BALIONAI.some((x) => x.registracija === redaguojamas) && !vartotojo.paslepti.includes(redaguojamas)) {
        vartotojo.paslepti.push(redaguojamas);
      }
    }
    vartotojo.pridedami = vartotojo.pridedami.filter((x) => x.registracija !== b.registracija);
    vartotojo.pridedami.push(b);
    vartotojo.paslepti = vartotojo.paslepti.filter((r) => r !== b.registracija);
    issaugotiBalionus();
    atnaujintiBalionus(b.registracija);
    redaguotiBalioną(visiBalionai().find((x) => x.registracija === b.registracija));
    $("issaugota").hidden = false;
    skaiciuoti();
  });

  // balionai.js turinys, kurį galima įklijuoti GitHub'e
  function balionuFailas() {
    const lauk = BALIONO_LAUKAI;
    const blokai = visiBalionai().map((b) =>
      "  {\n" +
      lauk.map((k) => {
        const v = b[k] === undefined ? null : b[k];
        return "    " + k + ": " + (typeof v === "string" ? JSON.stringify(v) : String(v));
      }).join(",\n") +
      "\n  }"
    );
    return (
      "// Oro balionų duomenys. Žr. README.md, kaip pridėti ar pakeisti balioną.\n" +
      "//   registracija, tipas, turisFt3 (ft³), kupolasKg, krepsysKg, degikliaiKg,\n" +
      "//   talpuKiekis (kuro talpų, vnt.), talposKg (vienos pilnos talpos svoris, kg),\n" +
      "//   irangaKg (papildoma įranga, kg),\n" +
      "//   mtomKg (maksimali kilimo masė, kg; null – netikrinama)\n" +
      "//   minNusileidimoKg (minimali leistina nusileidimo masė, kg; null – netikrinama)\n\n" +
      "const BALIONAI = [\n" + blokai.join(",\n") + "\n];\n"
    );
  }

  $("kopijuotiBalionus").addEventListener("click", () => {
    const tekstas = balionuFailas();
    const mygtukas = $("kopijuotiBalionus");
    const pavyko = () => {
      mygtukas.textContent = "✓ Nukopijuota – įklijuokite į balionai.js";
      setTimeout(() => (mygtukas.textContent = "Kopijuoti sąrašą failui balionai.js"), 3000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(tekstas).then(pavyko, () => rodytiTeksta(tekstas));
    } else {
      rodytiTeksta(tekstas);
    }
  });

  function rodytiTeksta(tekstas) {
    let ta = $("balionuKodas");
    if (!ta) {
      ta = document.createElement("textarea");
      ta.id = "balionuKodas";
      ta.className = "code-box";
      ta.readOnly = true;
      $("kopijuotiBalionus").after(ta);
    }
    ta.value = tekstas;
    ta.rows = Math.min(20, tekstas.split("\n").length);
    ta.focus();
    ta.select();
  }

  function rodytiBalionoDuomenis(b) {
    const dl = $("balionoDuomenys");
    dl.innerHTML = "";
    if (!b) return;
    const kur = kurasIrIranga(b);
    const eil = [
      ["Tipas", b.tipas],
      ["Tūris", b.turisFt3.toLocaleString("lt-LT") + " ft³"],
      ["Kupolas", kg(b.kupolasKg)],
      ["Krepšys", kg(b.krepsysKg)],
      ["Degikliai", kg(b.degikliaiKg)],
      ["Papildoma įranga", nurodyta(b.irangaKg) ? kg(b.irangaKg) : "nenurodyta"],
      ["Kuro talpos (pilnos)", kur.kiekis + " × " + kg(kur.talposKg) + " = " + kg(kur.talpos), "wide"],
      ["Min. nusileidimo masė", b.minNusileidimoKg ? kg(b.minNusileidimoKg) : "nenurodyta"]
    ];
    if (b.mtomKg) eil.push(["MTOM", kg(b.mtomKg)]);
    eil.forEach(([k, v, klase]) => {
      const div = document.createElement("div");
      if (klase) div.className = klase;
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
  const ivestys = ["temp", "qnh", "kupoloTemp", "aukstis", "pilotoSvoris"];

  function skaiciuoti() {
    const b = pasirinktasBalionas();
    rodytiBalionoDuomenis(b);

    const ispejimai = [];
    if (!b) ispejimai.push("Pridėkite bent vieną balioną („Tvarkyti balionus“).");

    const piloto = skaicius($("pilotoSvoris"));
    if (piloto === null) ispejimai.push("Neįvestas piloto svoris.");
    let igula = piloto || 0;
    keleiviaiEl.querySelectorAll(".crew-row").forEach((r, i) => {
      const s = skaicius(r.querySelector(".k-svoris"));
      if (s === null) ispejimai.push("Neįvestas " + (i + 1) + "-ojo keleivio svoris.");
      igula += s || 0;
    });
    $("igulaViso").textContent = kg(igula);

    // Kuras ir įranga imami iš baliono duomenų
    const kur = b ? kurasIrIranga(b) : null;
    if (kur && kur.neivesta) {
      ispejimai.push(
        "Balionui " + b.registracija + " neįvesti visi kuro ar įrangos duomenys – naudojama " +
        kur.kiekis + " × " + kg(kur.talposKg) + " talpos ir " + kg(kur.iranga) +
        " įrangos. Papildykite „Tvarkyti balionus“."
      );
    }

    const eilutes = b
      ? [
          ["Kupolas", b.kupolasKg],
          ["Krepšys", b.krepsysKg],
          ["Degikliai", b.degikliaiKg],
          ["Kuro talpos (" + kur.kiekis + " × " + kg(kur.talposKg) + ")", kur.talpos],
          ["Papildoma įranga", kur.iranga],
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

    // Per didelis rezervas: bendras svoris mažesnis už minimalią nusileidimo masę
    const minNusileidimo = b && b.minNusileidimoKg ? b.minNusileidimoKg : null;
    const perLengvas = minNusileidimo !== null && bendras < minNusileidimo;
    if (perLengvas) {
      ispejimai.unshift(
        "Bendras svoris " + kg(bendras) + " mažesnis už minimalią nusileidimo masę " +
        kg(minNusileidimo) + " – trūksta " + kg(minNusileidimo - bendras) + "."
      );
    }

    const skirtumas = jega === null ? null : jega - bendras;

    $("keliamoji").textContent = kg(jega, 0);
    $("bendras").textContent = kg(bendras);
    $("skirtumas").textContent = skirtumas === null ? "–" : (skirtumas > 0 ? "+" : "") + kg(skirtumas);

    const minEil = $("minNusileidimoEil");
    minEil.hidden = minNusileidimo === null;
    minEil.dataset.state = perLengvas ? "bad" : "";
    $("minNusileidimo").textContent = minNusileidimo === null ? "–"
      : perLengvas ? kg(minNusileidimo) + " (trūksta " + kg(minNusileidimo - bendras) + ")"
      : kg(minNusileidimo);

    const busena = skirtumas === null ? "" : skirtumas > 0 && !perLengvas ? "ok" : "bad";
    $("rezultatas").dataset.state = busena;
    $("statusBar").dataset.state = busena;
    $("statusLabel").textContent = perLengvas ? "Atsarga · per mažas svoris" : "Atsarga";
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
    const visi = visiBalionai();
    if (!b) {
      if (visi.length > 1) balionoSelect.value = visi[1].registracija;
      return;
    }
    if (visi.some((x) => x.registracija === b.balionas)) balionoSelect.value = b.balionas;
    ivestys.forEach((id) => {
      if (b[id] !== undefined) $(id).value = b[id];
    });
    $("pilotoVardas").value = b.pilotoVardas || "";
    (b.keleiviai || []).forEach((k) => pridetiKeleivi(k.vardas, k.svoris));
  }

  // --- Įvykiai ---
  document.querySelector("main").addEventListener("input", (e) => {
    if (e.target.id === "pilotoVardas" || e.target.closest("#naujasBalionas")) return;
    skaiciuoti();
  });
  balionoSelect.addEventListener("change", skaiciuoti);

  atnaujintiBalionus();
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
