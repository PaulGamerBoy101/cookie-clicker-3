/* Cookie Clicker 3 — engine configuration.
 *
 * The 2.048 engine reads VERSION, BETA and App as free variables at module
 * evaluation time, so these must be published on `window` before the engine
 * module is imported (import order in src/main.js guarantees that).
 */
window.VERSION = 3.000;
window.BETA = 0;
// The 2.048 build carried a hook for a mobile app wrapper; CC3 is web-only.
window.App = 0;
