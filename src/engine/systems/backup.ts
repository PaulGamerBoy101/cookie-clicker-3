/**
 * systems/backup.ts — CC3 rolling save backups (not in 2.048).
 *
 * The engine keeps exactly one save in localStorage (Game.SaveTo). If a bad
 * state is written over it — a mis-clicked import, a bug, a mod mishap — the
 * previous state is gone. This module keeps a rolling history of the last N
 * successful saves (each the same escaped save string the engine stores and
 * ImportSaveCode accepts), dedupes consecutive identical saves, prunes the
 * oldest entries past the cap, and exposes list/restore so the Options menu
 * can offer "restore an older backup" without leaving the game.
 *
 * Storage: one localStorage key per game (`CookieClickerGameBackups` /
 * `CookieClickerGameBetaBackups`), holding a JSON array of
 * `{ timestamp, save }` entries. `save` is the exact escaped string the main
 * save slot holds, so restoring is a plain ImportSaveCode + WriteSave.
 *
 * All functions are safe no-ops when localStorage is unavailable (private
 * mode, storage quota, storage disabled) — a backup that cannot be written is
 * never allowed to break a save.
 */
import type { Game } from '../types';

/** How many historical saves to keep. */
export const BACKUP_LIMIT = 10;
/** Ignore saves that differ only by less than this many bytes from the last
 * backup (identical strings are skipped entirely; this guards against
 * near-identical churn). */
export const BACKUP_MIN_DIFFERENCE = 8;

export interface SaveBackup {
	timestamp: number;
	save: string;
}

export function backupKey(game: Game): string {
	return game.SaveTo + 'Backups';
}

/**
 * Monotonic per-session clock: Date.now() can return the same millisecond
 * for consecutive saves (the 60s autosave, a manual save, a capture — all
 * in one tick), which would make two backups share a timestamp and break
 * restore-by-timestamp. The wall clock seeds the counter; each capture
 * bumps it, so every entry is strictly ordered even within one millisecond.
 */
export function nextBackupTimestamp(game: Game): number {
	const now = Date.now();
	const last = (game as any).__cc3BackupClock || 0;
	const timestamp = now > last ? now : last + 1;
	(game as any).__cc3BackupClock = timestamp;
	return timestamp;
}

export function readBackups(game: Game): SaveBackup[] {
	const raw = localStorageGet(backupKey(game));
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((entry) => entry && typeof entry.timestamp === 'number' && typeof entry.save === 'string')
			.sort((a, b) => a.timestamp - b.timestamp);
	} catch (e: any) {
		return [];
	}
}

function writeBackups(game: Game, backups: SaveBackup[]): boolean {
	try {
		localStorageSet(backupKey(game), JSON.stringify(backups));
		return true;
	} catch (e: any) {
		return false;
	}
}

/**
 * Record a successful save into the rolling history. Called from
 * systems/save.ts WriteSave right after the main slot is written.
 */
export function CaptureSave(game: Game, saveData: string): void {
	if (!saveData || saveData.length < BACKUP_MIN_DIFFERENCE) return;
	const backups = readBackups(game);
	const last = backups[backups.length - 1];
	if (last && last.save === saveData) return; // no change since the last backup
	backups.push({ timestamp: nextBackupTimestamp(game), save: saveData });
	while (backups.length > BACKUP_LIMIT) backups.shift();
	writeBackups(game, backups);
}

/** The current history, newest first (for display). */
export function ListBackups(game: Game): SaveBackup[] {
	return readBackups(game).slice().reverse();
}

/** Human-readable timestamp for the menu (e.g. "08/22 14:33"). */
export function FormatBackupTime(timestamp: number): string {
	const date = new Date(timestamp);
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Restore the game to a saved backup. The backup is imported through the same
 * ImportSaveCode path a pasted export uses, then written back to the main
 * save slot (which also records a fresh backup of the restored state).
 */
export function RestoreBackup(game: Game, timestamp: number): boolean {
	if (!Number.isFinite(timestamp)) return false;
	const backups = readBackups(game);
	const backup = backups.find((entry) => entry.timestamp === timestamp);
	if (!backup || !backup.save) return false;
	const ok = game.ImportSaveCode(backup.save);
	if (ok) game.WriteSave();
	return ok;
}

/** A file-safe name for a backup download, e.g. `MyBakeryBackup-0822-1433.txt`. */
export function BackupFileName(game: Game, timestamp: number): string {
	const date = new Date(timestamp);
	const pad = (value: number) => String(value).padStart(2, '0');
	const name = game.bakeryName.replace(/[^a-zA-Z0-9]+/g, '');
	return name + 'Backup-' + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes()) + '.txt';
}

/**
 * Download a backup as a .txt save file — the same format the "Save to
 * file" button produces, so the file imports like any other export. Mirrors
 * FileSave's App guard (embedded hosts handle downloads themselves).
 */
export function DownloadBackup(game: Game, timestamp: number): boolean {
	if (App) return false;
	if (!Number.isFinite(timestamp)) return false;
	const backups = readBackups(game);
	const backup = backups.find((entry) => entry.timestamp === timestamp);
	if (!backup || !backup.save) return false;
	const blob = new Blob([backup.save], { type: 'text/plain;charset=utf-8' });
	saveAs(blob, BackupFileName(game, timestamp));
	return true;
}

/** The Options-menu dropdown markup for the backup list. */
export function BackupListHtml(game: Game): string {
	const backups = ListBackups(game);
	if (backups.length === 0) {
		return '<div class="listing"><label>' + loc("No backups yet — they are created automatically on each save (max %1).", String(BACKUP_LIMIT)) + '</label></div>';
	}
	const options = backups
		.map((backup) => '<option value="' + backup.timestamp + '">' + loc("Backup from %1", FormatBackupTime(backup.timestamp)) + '</option>')
		.join('');
	return (
		'<div class="listing">' +
		'<select id="backupSelect" style="max-width:220px;margin-right:4px;">' + options + '</select>' +
		'<a class="option smallFancyButton" onclick="Game.RestoreBackup(parseInt(document.getElementById(\'backupSelect\').value,10));PlaySound(\'snd/tick.mp3\');">' + loc("Restore") + '</a>' +
		'<a class="option smallFancyButton" onclick="Game.DownloadBackup(parseInt(document.getElementById(\'backupSelect\').value,10));PlaySound(\'snd/tick.mp3\');">' + loc("Download backup file") + '</a>' +
		'<label>' + loc("Restore or download an earlier autosave (keeps the last %1 saves)", String(BACKUP_LIMIT)) + '</label>' +
		'</div>'
	);
}

/** Rebuild the backups listing inside the Options menu (called on menu draw). */
export function RefreshBackupList(game: Game): void {
	const target = l('backupList');
	if (!target) return;
	target.innerHTML = BackupListHtml(game);
}
