/* さんすうクエスト Service Worker（契約 v7-refactor-b）
 * 目的: オフライン動作の担保（規約 §0）。vanilla・依存ライブラリゼロ・外部から何も読み込まない。
 *
 * CACHE_NAME はデプロイのたびに更新すること（更新しないと activate 時の旧キャッシュ破棄が走らず、
 * 新しいコードが子どもの端末に届かない）。
 * 由来: v7-refactor-b 初版（2026-07-27）。
 */
const CACHE_NAME = 'sq-v1';

/* CORE: install の中で同期的に取得する。ここが失敗したら install 失敗（＝旧SWのまま。安全側）。
 * ⚠️ ここには「起動直後に必ず要る最小限」だけを置く（index.html + GUIDE_IMG の2件）。 */
const CORE = [
  './',
  'img/guide.webp',
];

/* REST: install 完了後にバックグラウンドで順次取得する残り45件。
 * 個々の失敗は無視し、install の成否には影響させない（電波が細い環境で初回起動をブロックしない）。
 * ⚠️ m13 は欠番（作らない）。ファイル名は `ls img/*.webp` の実出力と一致させること。 */
const REST = [
  'img/s01.webp', 'img/s02.webp', 'img/s03.webp', 'img/s04.webp', 'img/s05.webp',
  'img/s06.webp', 'img/s07.webp', 'img/s08.webp', 'img/s09.webp', 'img/s10.webp', 'img/s11.webp',
  'img/K1.webp', 'img/K2.webp', 'img/K3.webp', 'img/K4.webp', 'img/K5.webp',
  'img/K6.webp', 'img/K7.webp', 'img/K8.webp', 'img/K9.webp', 'img/K10.webp',
  'img/m01.webp', 'img/m02.webp', 'img/m03.webp', 'img/m04.webp', 'img/m05.webp',
  'img/m06.webp', 'img/m07.webp', 'img/m08.webp', 'img/m09.webp', 'img/m10.webp',
  'img/m11.webp', 'img/m12.webp', 'img/m14.webp', 'img/m15.webp', 'img/m16.webp',
  'img/m17.webp', 'img/m18.webp', 'img/m19.webp', 'img/m20.webp', 'img/m21.webp',
  'img/m22.webp', 'img/m23.webp', 'img/m24.webp', 'img/m25.webp',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
  /* 残り45件のバックグラウンド先読みは activate の waitUntil に含めない
   * (= install/activate の成否・完了に一切影響させない。個々の失敗も無視する)。 */
  precacheRestInBackground();
});

/* 残り45件をバックグラウンドで順次取得する。個々の失敗は無視する。 */
function precacheRestInBackground() {
  return caches.open(CACHE_NAME).then(cache => {
    return REST.reduce((chain, url) => {
      return chain.then(() => cache.add(url).catch(() => {}));
    }, Promise.resolve());
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  /* 他オリジンへの要求(gtag.js・GA4 の /g/collect 等)には一切介入しない。 */
  if (url.origin !== location.origin) return;

  /* ナビゲーション要求(=index.html)は network-first。
   * ⚠️ 最重要: cache-first にすると古いコードが子どもの端末に固着し、修正が届かなくなる。 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./'))
    );
    return;
  }

  /* img/ 配下は cache-first。vercel.json で immutable 指定済み・差し替えは新ファイル名で行う運用。 */
  if (url.pathname.includes('/img/')) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, resClone)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  /* 上記以外の同一オリジン要求は素通し(介入しない)。 */
});
