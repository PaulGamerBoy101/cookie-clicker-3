import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The engine's CSS references public assets as `url(img/…)` (root-relative).
// Vite emits the bundled CSS into `dist/assets/`, which shifts the base for
// relative `url()` refs — so `url(img/…)` would resolve to `dist/assets/img/…`
// (nonexistent) and every CSS background image would break. The original
// Cookie Clicker keeps style.css at the root, so it never hits this. Rewrite
// `url(img/…)` -> `url(../img/…)` in the built CSS so the refs resolve back to
// `dist/img/…`. Source CSS is left untouched (still correct in dev, where the
// CSS is served from the root).
function fixPublicAssetUrls(): Plugin {
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

// Stamp the service worker's cache name with a per-build content hash.
//
// The SW serves cache-first with a fixed cache name (public/sw.js). If that
// name never changes, a deploy that doesn't touch sw.js is invisible to the
// browser (byte-identical script => no SW update), and installed clients keep
// getting the old cached index.html — and with it the old hashed bundles —
// forever. So after each build we hash everything in dist/ except sw.js
// itself (file names + bytes) and rewrite the __BUILD__ placeholder in
// dist/sw.js with the result:
//   - any change (re-bundled script, swapped image, new sound) => new hash
//     => new cache name => the updated sw.js installs and activate() drops
//     the previous build's cache;
//   - an identical rebuild => identical hash => no needless SW churn.
// The build fails loudly if the placeholder is missing (template out of sync).
function stampServiceWorker(): Plugin {
	let outDir: string;
	return {
		name: 'cc3:stamp-service-worker',
		apply: 'build',
		configResolved(config) {
			outDir = config.build.outDir;
		},
		closeBundle() {
			const swPath = join(outDir, 'sw.js');
			const src = readFileSync(swPath, 'utf8');
			if (!src.includes('__BUILD__')) {
				this.error('dist/sw.js is missing the __BUILD__ placeholder — is public/sw.js in sync?');
				return;
			}
			const hash = createHash('sha256');
			const walk = (dir: string) => {
				for (const name of readdirSync(dir).sort()) {
					if (dir === outDir && name === 'sw.js') continue; // not the stamp's own input
					const p = join(dir, name);
					if (statSync(p).isDirectory()) {
						walk(p);
					} else {
						hash.update(name);
						hash.update(readFileSync(p));
					}
				}
			};
			walk(outDir);
			const stamp = hash.digest('hex').slice(0, 12);
			// replaceAll: the placeholder also appears in the file's header
			// comment, and every occurrence must be stamped.
			writeFileSync(swPath, src.replaceAll('__BUILD__', stamp));
			this.info(`service worker cache stamped: cookie-clicker-3-${stamp}`);
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
	plugins: [fixPublicAssetUrls(), stampServiceWorker()],
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
