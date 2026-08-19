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
 */
const CACHE = 'cookie-clicker-3-v1';
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
