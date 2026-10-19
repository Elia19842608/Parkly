/*
 * Parkly – service worker
 * Tiene sul telefono l'app e le foto già viste, così si apre e funziona anche senza rete.
 * I dati (comuni, parchi, ispezioni…) e i salvataggi da inviare li gestisce l'app nella sua memoria.
 */
const APP = "parkly-app-v1";
const FOTO = "parkly-foto-v1";
const STATICI = "parkly-statici-v1";
const TENGO = [APP, FOTO, STATICI];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(APP).then(c => c.add(new Request("./", { cache: "reload" }))).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!TENGO.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // la pagina dell'app: prima la rete (per gli aggiornamenti), senza rete la copia salvata
  if (r.mode === "navigate" || (u.origin === location.origin && (u.pathname.endsWith("/") || u.pathname.endsWith("/index.html")))) {
    e.respondWith(pagina(r));
    return;
  }
  // foto pubbliche dell'archivio: non cambiano mai, si tengono
  if (u.pathname.includes("/storage/v1/object/public/")) { e.respondWith(primaLaCopia(r, FOTO, 3000, true)); return; }
  // icone e manifest dell'app, caratteri, mappe, librerie
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$|basemaps\.cartocdn\.com$|tile\.openstreetmap\.org$|cdnjs\.cloudflare\.com$|cdn\.jsdelivr\.net$|unpkg\.com$/.test(u.hostname)) {
    e.respondWith(primaLaCopia(r, STATICI, 4000, false));
  }
});

async function pagina(r) {
  const c = await caches.open(APP);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000); // segnale debole: dopo 5 secondi si apre la copia
    const res = await fetch(r, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (res.ok) await c.put("./", res.clone());
    return res;
  } catch {
    return (await c.match("./")) || (await c.match(r)) || new Response("<h1>Parkly</h1><p>Apri l'app una volta con la rete.</p>", { headers: { "content-type": "text/html; charset=utf-8" } });
  }
}

async function primaLaCopia(r, nome, max, cors) {
  const c = await caches.open(nome);
  const hit = await c.match(r.url, { ignoreVary: true });
  if (hit) return hit;
  try {
    // le foto si chiedono in CORS: così la copia non occupa spazio "gonfiato" sul telefono
    const res = cors ? await fetch(r.url, { mode: "cors", credentials: "omit" }) : await fetch(r);
    if (res.ok || res.type === "opaque") {
      await c.put(r.url, res.clone());
      pota(c, max);
    }
    return res;
  } catch (err) {
    if (cors) { try { return await fetch(r); } catch { /* */ } }
    return Response.error();
  }
}

let potando = false;
async function pota(c, max) {
  if (potando) return;
  potando = true;
  try {
    const k = await c.keys();
    if (k.length > max) for (const x of k.slice(0, k.length - max)) await c.delete(x);
  } finally { potando = false; }
}
