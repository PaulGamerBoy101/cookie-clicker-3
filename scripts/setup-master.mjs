#!/usr/bin/env node
/**
 * scripts/setup-master.mjs — provision the "master" baseline build for
 * tests/save-compat.spec.js.
 *
 * The save-compat spec diffs the working tree's save output against the
 * pristine master branch's (playwright.config.js serves a baseline build on
 * :4174 whenever one exists). This script materializes that baseline at
 * .cc3-master/: a detached git worktree of master (your own checkout is
 * never touched) with node_modules installed and dist/ built.
 *
 * Idempotent: a re-run is a no-op unless the ref moved (the current commit
 * is recorded in .cc3-master/.cc3-baseline-ref), in which case the worktree
 * is rebuilt from scratch. Override the ref with CC3_BASELINE_REF (default:
 * master). Without this baseline the save-compat tests skip themselves, so
 * running it is optional — `npm run test:compat` just won't cover the
 * compatibility gate.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REF = process.env.CC3_BASELINE_REF || 'master';
const DIR = '.cc3-master';
const marker = path.join(DIR, '.cc3-baseline-ref');
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

let commit;
try {
	commit = execSync(`git rev-parse --verify ${REF}`, { encoding: 'utf8' }).trim();
} catch {
	console.error(
		`[setup-master] cannot resolve ref "${REF}" — is this a git repo whose history contains ${REF}? ` +
		`(shallow clones may need: git fetch --unshallow, or set CC3_BASELINE_REF to a commit that exists locally)`
	);
	process.exit(1);
}

if (
	fs.existsSync(path.join(DIR, 'dist/index.html')) &&
	fs.existsSync(marker) &&
	fs.readFileSync(marker, 'utf8').trim() === commit
) {
	console.log(`[setup-master] baseline is up to date (${REF} @ ${commit.slice(0, 10)}) — nothing to do`);
	process.exit(0);
}

// tear down any previous baseline (a registered worktree, or a leftover dir)
if (fs.existsSync(DIR)) {
	try {
		run(`git worktree remove --force ${DIR}`);
	} catch {
		fs.rmSync(DIR, { recursive: true, force: true });
	}
}

console.log(`[setup-master] checking out ${REF} @ ${commit.slice(0, 10)} into ${DIR}/ (detached worktree)`);
run(`git worktree add --detach ${DIR} ${commit}`);
fs.writeFileSync(marker, commit);

console.log('[setup-master] installing baseline dependencies...');
run('npm ci --no-audit --no-fund', { cwd: DIR });

console.log('[setup-master] building baseline...');
run('npm run build', { cwd: DIR });

console.log(`[setup-master] done — run the compat gate with: npm run test:compat`);
