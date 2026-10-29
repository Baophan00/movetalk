/*
 * Keeps the app usable on a phone with a bad connection: the shell and the lesson audio
 * are cached, pages themselves always try the network first so a deploy is never stale.
 */
const VERSION = 'move-v4'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

/** Cache the shell and the JS/CSS the current page actually points at, so the app opens offline. */
async function precache() {
  const cache = await caches.open(VERSION)
  await Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined)))
  try {
    const html = await (await fetch('/', { cache: 'no-store' })).text()
    const assets = [...html.matchAll(/\/assets\/[A-Za-z0-9_.-]+/g)].map((m) => m[0])
    await Promise.all(assets.map((url) => cache.add(url).catch(() => undefined)))
  } catch {
    /* offline install: the shell is enough */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Pages: network first, cache as fallback so offline still opens something.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put('/', copy)).catch(() => undefined)
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Built assets and audio never change under the same name: serve from cache, fill it quietly.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/audio/') || /\.(png|svg|jpg|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => undefined)
            }
            return res
          }),
      ),
    )
  }
})
