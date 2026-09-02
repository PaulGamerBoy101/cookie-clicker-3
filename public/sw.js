/* Cookie Clicker 3 — service worker.
 *
 * Makes the game bootable offline: same-origin GET responses are cached on
 * first use (cache-first). Two correctness points that bit us during the
 * port:
 *   - `Cache.put()` consumes the response body, so we must hand the browser
 *     an untouched `response` and store a `response.clone()`. Returning the
 *     consumed response is what broke dynamic `import()` of the code-split
 *     minigame/language chunks ("error loading dynamically imported module").
 *   - every cache operation is best-effort (try/catch) so a cache failure
 *     can never turn into a failed fetch.
 *
 * Deploy updates: CACHE is stamped at build time (the cc3:stamp-service-worker
 * plugin in vite.config.ts) — `__BUILD__` becomes a content hash of the built
 * dist/, so every changed build gets a new cache name. Returning clients then
 * see the changed sw.js on their next navigation, install the new SW, and its
 * activate() drops the old cache. With a static cache name the browser would
 * never update the SW (byte-identical script) and the cache-first index.html
 * would pin the previous build on every installed client forever. In dev this
 * file is served as-is with the literal placeholder; the SW only registers in
 * production builds, so the placeholder never becomes a live cache name.
 */
const CACHE = 'cookie-clicker-3-__BUILD__';
const MAX_ENTRIES = 512;

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	if (new URL(request.url).origin !== self.location.origin) return;

	// CC3 perf: media requests are excluded from the SW entirely. Streaming
	// <audio> is fetched with Range requests (cache.put() would strip the 206
	// body; storing the full 200 would pin ~12 MB of music in the 512-entry
	// cache), and tracks only load on first play anyway. Bypassing the SW lets
	// the browser's own media pipeline (and its HTTP cache) handle them.
	const url = new URL(request.url);
	if (url.pathname.startsWith('/snd/music/') || request.headers.has('range')) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const cached = await cache.match(request);
			if (cached) return cached;

			const response = await fetch(request);
			if (response.ok) {
				try {
					// Evict oldest entries before storing, to bound the cache.
					const keys = await cache.keys();
					if (keys.length >= MAX_ENTRIES) await cache.delete(keys[0]);
					// Store a clone; the original body is returned to the page.
					await cache.put(request, response.clone());
				} catch {
					// Caching is best-effort; never fail the request over it.
				}
			}
			return response;
		})()
	);
});
