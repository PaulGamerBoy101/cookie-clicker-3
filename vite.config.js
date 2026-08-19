import { defineConfig } from 'vite';

// Cookie Clicker 3 — modern port of Cookie Clicker 2.048.
//
// The engine is ported 2.048 classic-script code (one 890 KB file) that has
// been split into ES modules under src/engine. Nothing here is transpiled:
// browsers get the module code as-is, and Vite only bundles, code-splits
// (minigames + languages) and minifies.
export default defineConfig({
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
