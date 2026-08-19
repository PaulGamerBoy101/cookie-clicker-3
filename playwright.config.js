// Playwright config: runs the in-page QA probe suite (tests/qa.spec.js)
// against a FRESH production build. The webServer directive builds
// (npm run build) and serves dist/ (vite preview) — the same artifacts the
// Pages deploy publishes. The probes are stateful (saves, in-page reloads),
// so tests run serially in one worker.
import { defineConfig } from '@playwright/test';

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
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
