/* Cookie Clicker 3 — engine configuration.
 *
 * The 2.048 engine reads VERSION, BETA and App as free variables at module
 * evaluation time, so these must be published on `window` before the engine
 * module is imported (import order in src/main.ts guarantees that).
 */
window.VERSION = 3.000;
window.BETA = 0;
// The 2.048 build carried a hook for a mobile app wrapper; CC3 is web-only.
window.App = 0;

/* CC3: explicit module marker — at runtime these files are always ESM modules
 * (Vite bundles them as such), and this keeps their top-level var/function
 * declarations out of the TS global scope. Zero runtime effect. */
export {};
