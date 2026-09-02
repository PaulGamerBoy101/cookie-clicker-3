// Playwright config: runs the in-page QA probe suite (tests/qa.spec.js)
// against a FRESH production build. The first webServer directive builds
// (npm run build) and serves dist/ (vite preview) — the same artifacts the
// Pages deploy publishes. The probes are stateful (saves, in-page reloads),
// so tests run serially in one worker.
//
// The second webServer is the save-compat baseline: whenever a pristine
// master-branch build exists at .cc3-master/ (provisioned by
// scripts/setup-master.mjs, or a checkout step in CI), a `vite preview`
// serves it on :4174 and tests/save-compat.spec.js runs; without one that
// spec skips itself (see its header).
import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

// The baseline is a directory with a built dist/ — its own package.json is
// the marker that this isn't a half-provisioned checkout.
const hasMasterBaseline = fs.existsSync('.cc3-master/package.json');

export default defineConfig({
	testDir: './tests',
	timeout: 120_000,
	expect: { timeout: 15_000 },
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
	},
	webServer: [
		{
			command: 'npm run build && npm run preview -- --port 4173 --strictPort',
			url: 'http://localhost:4173',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		...(hasMasterBaseline
			? [
					{
						command: 'npm run preview --prefix .cc3-master -- --port 4174 --strictPort',
						url: 'http://localhost:4174',
						reuseExistingServer: !process.env.CI,
						timeout: 120_000,
					},
				]
			: []),
	],
});
