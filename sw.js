// Leidžia skaičiuoklei veikti be interneto.
// Pakeitus failus, padidinkite versiją, kad telefonai gautų naujus.
const CACHE = "oro-balionas-v2";
const FAILAI = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "balionai.js",
  "manifest.json",
  "icon.svg",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", (e) => {
  // cache: "reload" – imama tiesiai iš serverio, ne iš naršyklės talpyklos
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(FAILAI.map((f) => new Request(f, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Pirmiausia bandoma internetu (kad matytųsi naujausi failai),
// nepavykus – imama iš išsaugotos kopijos.
// cache: "no-cache" – kaskart patikrinama serveryje, ar failas nepasikeitė,
// kitaip GitHub Pages iki 10 min. rodytų seną versiją.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" })
      .then((res) => {
        if (res.ok) {
          const kopija = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, kopija));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
