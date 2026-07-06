/* MAG CoP service worker
   - 静的シェル（HTML/アイコン/manifest）: キャッシュ優先（オフラインでも開ける）
   - index*.json / videos*.json: ネットワーク優先（常に最新、失敗時のみキャッシュ）
   - PDF: ネットワーク優先（容量が大きいため事前キャッシュはしない）
   更新時は CACHE_VERSION を上げると旧キャッシュが破棄される */
const CACHE_VERSION = 'mag-cop-v4';
const SHELL = [
  './',
  'index.html',
  'saiten-search.html',
  'pdf-list.html',
  'videos.html',
  'kitei.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  const isData = url.pathname.endsWith('.json') || url.pathname.endsWith('.pdf');

  if (isData) {
    // network-first: 最新データを優先、オフライン時のみキャッシュ
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok && url.pathname.endsWith('.json')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // cache-first: シェルは即時表示、裏で更新
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fresh = fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fresh;
      })
    );
  }
});
