/* CC3 rewrite (phase 6, slice 5): the Debug string-collector extracted from
 * engine/main.ts verbatim. `debugStr` accumulates a '; '-joined string of
 * debug notes; the engine publishes both on window via its shim (so the
 * legacy `Debug(...)` calls from other modules keep resolving), and the
 * engine imports `Debug`/`debugStr` to keep those shim entries bound to the
 * same values.
 */

export var debugStr='';
export function Debug(what: any)
{
	if (!debugStr) debugStr=what;
	else debugStr+='; '+what;
}
