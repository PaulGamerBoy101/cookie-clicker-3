import { defineConfig } from 'vite';

// The engine's CSS references public assets as `url(img/…)` (root-relative).
// Vite emits the bundled CSS into `dist/assets/`, which shifts the base for
// relative `url()` refs — so `url(img/…)` would resolve to `dist/assets/img/…`
// (nonexistent) and every CSS background image would break. The original
// Cookie Clicker keeps style.css at the root, so it never hits this. Rewrite
// `url(img/…)` -> `url(../img/…)` in the built CSS so the refs resolve back to
// `dist/img/…`. Source CSS is left untouched (still correct in dev, where the
// CSS is served from the root).
function fixPublicAssetUrls() {
	let applied = false;
	return {
		name: 'cc3:fix-public-asset-urls',
		apply: 'build',
		generateBundle(_options, bundle) {
			for (const file of Object.values(bundle)) {
				if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue;
				const src = file.source.toString();
				if (!/url\(\s*['"]?img\//.test(src)) continue;
				file.source = src.replace(/url\(\s*(['"]?)img\//g, 'url($1../img/');
				applied = true;
			}
			if (applied) this.info('rewrote url(img/…) -> url(../img/…) in built CSS');
		},
	};
}

// Cookie Clicker 3 — modern port of Cookie Clicker 2.048.
//
// The engine is ported 2.048 classic-script code (one 890 KB file) that has
// been split into ES modules under src/engine. Nothing here is transpiled:
// browsers get the module code as-is, and Vite only bundles, code-splits
// (minigames + languages) and minifies.
export default defineConfig({
	plugins: [fixPublicAssetUrls()],
	// Relocatable build (works from any static host subpath, e.g. GitHub Pages).
	base: './',
	server: {
		port: 5173,
	},
	preview: {
		port: 4173,
	},
	build: {
		// The ported engine is old-style but perfectly valid ES; keep the
		// output readable and modern without downleveling anything.
		target: 'es2020',
		// The engine is a single large chunk by nature; silence the warning.
		chunkSizeWarningLimit: 4096,
		modulePreload: { polyfill: false }, // evergreen browsers only
	},
});
