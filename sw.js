/* MAG CoP service worker
   - 静的シェル（HTML/CSS/JS/アイコン/PDFビューア本体）: キャッシュ優先（オフラインでも開ける）
   - index*.json / videos*.json: ネットワーク優先（常に最新、失敗時のみキャッシュ）
   - PDF・動画: ネットワークのみ（容量が大きいため保存しない。部分読み込みもそのまま通す）
   更新時は CACHE_VERSION を上げると旧キャッシュが破棄される */
const CACHE_VERSION = 'mag-cop-v7';
const SHELL = [
  './',
  'index.html',
  'saiten-search.html',
  'pdf-list.html',
  'videos.html',
  'kitei.html',
  'viewer.html',
  'manifest.json',
  'theme.css',
  'pwa.js',
  'pdfview.js',
  'icons/ribbon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  // PDFビューア本体（PDF.js）。文字データ（cmaps）等は使ったときにキャッシュされる
  'pdfjs/pdf.min.mjs',
  'pdfjs/pdf.worker.min.mjs',
  'pdfjs/pdf_viewer.mjs',
  'pdfjs/pdf_viewer.css',
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
  const path = url.pathname;

  // PDF・動画はブラウザに任せる（Rangeによる部分読み込みをそのまま通す）
  if (/\.(pdf|mp4|webm|mov)$/i.test(path)) return;

  if (path.endsWith('.json')) {
    // network-first: 最新データを優先、オフライン時のみキャッシュ
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // viewer.html は ?file=… が毎回変わるので、クエリを無視して1つのキャッシュを使う
  const ignoreSearch = path.endsWith('/viewer.html');
  const key = ignoreSearch ? new Request(url.origin + path) : e.request;

  // cache-first: シェルは即時表示、裏で更新
  e.respondWith(
    caches.match(key, { ignoreSearch }).then((cached) => {
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(key, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
