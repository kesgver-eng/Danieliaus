// Leidžia skaičiuoklei veikti be interneto.
// Pakeitus failus, padidinkite versiją, kad telefonai gautų naujus.
const CACHE = "oro-balionas-v1";
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
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FAILAI)));
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

// Pirmiausia bandoma internetu (kad matytųsi naujausi duomenys),
// nepavykus – imama iš išsaugotos kopijos.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const kopija = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopija));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
