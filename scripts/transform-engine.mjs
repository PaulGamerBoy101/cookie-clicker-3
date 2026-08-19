#!/usr/bin/env node
/**
 * CC3 engine transform (build-time, one-shot).
 *
 * Ports the Cookie Clicker 2.048 classic-script engine into ES modules:
 *  - collects every top-level binding of the legacy main.js with acorn
 *  - declares implicit globals (top-level assignments to undeclared ids)
 *  - appends a shim that publishes the engine's globals on `window`, so the
 *    minigame modules (and the legacy mod API) can resolve their free variables
 *  - modernizes the boot hook (window.onload -> addEventListener)
 *  - swaps runtime <script> injection for dynamic ES module imports
 *    (window.loadLangModule / window.loadMinigameModule, provided by the entry)
 *  - converts loc/*.js into ESM language modules
 *
 * Re-run only when the upstream engine source changes.
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = '/tmp/cc2-source';
const ENG = join(root, 'src', 'engine');

const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s).replace(/\r\n?/g, '\n');

// CC3: images ship as WebP. The 2.048 engine references them as img/….png /
// img/….jpg string literals (store icons, backgrounds, minigame art, the
// preload list, dynamic icon[2] filenames). Rewrite those extensions to
// .webp so the engine loads the converted assets from public/img. CSS and
// index.html refs are rewritten separately (they're not engine source).
// The negative lookahead keeps the match to a real file extension (not a
// substring of a longer token), and any trailing ?v= cache-buster is preserved.
const toWebP = (s) => s.replace(/(img\/[A-Za-z0-9_./-]*?)\.(png|jpe?g)(?![A-Za-z0-9])/g, '$1.webp');

// A few engine refs build the image path by concatenating a quoted extension
// onto a variable, so the full-literal pass above can't see them (lock icons,
// building art, grandma variants, background tiles). Rewrite each known
// pattern exactly; throw if one is missing so an upstream drift fails the
// port loudly instead of silently 404ing an asset at runtime.
const concatExtFixes = [
  ["(Game.https?'lockOn':'lockOff')+'.png)", "(Game.https?'lockOn':'lockOff')+'.webp)"],
  ["art.base+'.png'", "art.base+'.webp'"],
  ["art.base+'Background.png'", "art.base+'Background.webp'"],
  ["choose(list)+'.png'", "choose(list)+'.webp'"],
  ["Game.bg+'.jpg'", "Game.bg+'.webp'"],
  ["Game.bgFade+'.jpg'", "Game.bgFade+'.webp'"],
  ["Game.AllMilks[i].pic+='.png'", "Game.AllMilks[i].pic+='.webp'"],
];
const applyConcatExt = (s) => {
  for (const [from, to] of concatExtFixes) {
    if (!s.includes(from)) throw new Error('concat-ext pattern not found: ' + from);
    s = s.split(from).join(to);
  }
  return s;
};

// CC3 one-column responsive mode: parameterize the min layout width (800) so
// the entry point can drop it to 400 on narrow viewports — the exact sizing
// change Orteil's "/* todo! */" note in style.css asked for ("change min game
// size ie. w/Math.max(800,w) to 400"). Wide layouts keep 800 via the fallback.
const applyMinLayoutW = (s) => {
  const from = 'w/Math.max(800,w),';
  const to = 'w/Math.max(Game.minLayoutW||800,w),';
  if (!s.includes(from)) throw new Error('min-layout-width pattern not found: ' + from);
  return s.split(from).join(to);
};

// A third category: bare-filename string literals with no img/ prefix —
// Pic('icons.png'), bg:'grandmaBackground.png', me.pic=='smallCookies.png'
// comparisons, Game.Loader.Load(['filler.png']), even 'dragon.png?v='. They
// resolve against Game.Loader.domain ('img/') at runtime. Rewrite any quoted
// literal of the form '<name>.png|jpg' to .webp; the leading-quote anchor
// keeps this from touching non-literal text, and it's safe to re-run because
// a rewritten .webp literal no longer matches.
const rewriteBareFilenames = (s) =>
  s.replace(/(['"])([A-Za-z0-9_-]+)\.(png|jpe?g)(?![A-Za-z0-9])/g, '$1$2.webp');

/**
 * Top-level bindings of a classic-script file (for the window shim).
 * These become module-scope bindings under ESM and must be republished on
 * window so other modules (minigames) and the legacy mod API can resolve
 * them as free variables.
 */
function topLevelNames(code) {
  const ast = acorn.parse(code, { ecmaVersion: 2020 });
  const declared = new Set();
  for (const node of ast.body) {
    if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations) if (d.id.type === 'Identifier') declared.add(d.id.name);
    } else if ((node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') && node.id) {
      declared.add(node.id.name);
    }
  }
  return [...declared];
}

/**
 * Implicit globals: identifiers assigned somewhere in the file (any scope)
 * but never declared (var/let/const/param/function name) anywhere in the
 * file. Classic scripts created these on `window` implicitly; ESM strict
 * mode throws on the assignment, so we declare them at the top.
 */
function implicitGlobals(code) {
  const ast = acorn.parse(code, { ecmaVersion: 2020 });
  const declared = new Set();
  const assigned = new Set();

  const collectDeclared = (id) => { if (id && id.type === 'Identifier') declared.add(id.name); };

  walk.simple(ast, {
    VariableDeclaration: (n) => { for (const d of n.declarations) collectDeclared(d.id); },
    FunctionDeclaration: (n) => { if (n.id) declared.add(n.id.name); },
    FunctionExpression: (n) => { if (n.id) declared.add(n.id.name); },
    ClassDeclaration: (n) => { if (n.id) declared.add(n.id.name); },
    ClassExpression: (n) => { if (n.id) declared.add(n.id.name); },
    Function: (n) => { for (const p of n.params) collectDeclared(p); },
    CatchClause: (n) => { if (n.param) collectDeclared(n.param); },
    AssignmentExpression: (n) => { if (n.left.type === 'Identifier') assigned.add(n.left.name); },
    UpdateExpression: (n) => { if (n.argument.type === 'Identifier') assigned.add(n.argument.name); },
  });

  // Never treat real browser globals that the code only overwrites a
  // property of (those are MemberExpressions anyway) — but if the file
  // assigns to these bare identifiers they are intentional redefinitions
  // (e.g. `Audio = function(...)`), so keep them. Nothing to filter.
  const implicit = [...assigned].filter((n) => !declared.has(n));
  return implicit;
}

/* ---------------------------------------------------------------- main.js */
const mainPath = join(ENG, 'main.js');
let code = stripBom(readFileSync(join(SRC, 'main.js'), 'utf8'));
const declared = topLevelNames(code);
const implicit = implicitGlobals(code);
console.log(`main.js: ${declared.length} top-level bindings, ${implicit.length} implicit globals [${implicit.join(', ')}]`);

// 1. Declare the implicit globals so ESM strict mode accepts the assignments.
const implicitVars = implicit.length
  ? `/* CC3: the original relied on implicit globals; declare them for module strict mode. */\nvar ${implicit.join(', ')};\n\n`
  : '';
code = implicitVars + code;

// 2. Boot hook: window.onload -> addEventListener('load').
if (!code.includes('window.addEventListener(\'load\',')) {
  code = code.replace('window.onload=function()', "window.addEventListener('load',function()");
  // the file ends with the closing `};` of that handler
  const last = code.lastIndexOf('};');
  code = code.slice(0, last) + '});' + code.slice(last + 2);
}

// 3. Language loading: classic <script> injection -> ES module imports.
{
  const a = "LoadLang('loc/EN.js?v='+Game.version,function(lang){return function(){";
  const b = "LoadLang('loc/'+lang+'.js?v='+Game.version,function(){";
  if (!code.includes('window.loadLangModule')) {
    for (const s of [a, b]) if (!code.includes(s)) throw new Error('boot patch anchor not found: ' + s);
    code = code.replace(a, "window.loadLangModule('EN',function(){");
    code = code.replace(b, 'window.loadLangModule(lang,function(){');
    code = code.replace('}}(lang));', '});');
  }
}

// 4. Minigame loading: <script> injection -> dynamic ES module imports.
{
  if (!code.includes('window.loadMinigameModule')) {
    const start = code.indexOf("setTimeout(function(me){return function(){\n\t\t\t\t\t\tvar script=document.createElement('script');");
    if (start === -1) throw new Error('minigame loader anchor not found');
    const end = code.indexOf('}}(me),10);', start);
    if (end === -1) throw new Error('minigame loader end not found');
    const replacement = [
      '// CC3: minigame scripts are ES modules resolved by the entry point',
      'window.loadMinigameModule(me.minigameUrl).then(function(){',
      '\t\t\t\t\t\tif (!me.minigameLoaded) Game.scriptLoaded(me);',
      '\t\t\t\t\t},function(){',
      '\t\t\t\t\t\tme.minigameLoading=false;',
      '\t\t\t\t\t\tif (!me.minigameLoaded && !Game.showedScriptLoadError)',
      '\t\t\t\t\t\t{',
      '\t\t\t\t\t\t\tGame.showedScriptLoadError=true;',
      '\t\t\t\t\t\t\tGame.Notify(loc("Error!"),\'Couldn\\\'t load minigames. Try reloading.\');',
      '\t\t\t\t\t\t}',
      '\t\t\t\t\t});',
    ].join('\n');
    code = code.slice(0, start) + replacement + code.slice(end + '}}(me),10);'.length);
  }
}

// 4a. LoadMinigames loop: block-scope `me`.
// The 2.048 original captured `me` by value with an IIFE around the async
// <script> onload handler. The ES-module import().then() replacement above
// drops that IIFE, so a function-scoped `var me` would let the .then()/.catch()
// closures observe the loop's final value — i.e. the wrong building — by the
// time the dynamic import resolves. Scoping `me` per iteration fixes the
// capture using the modern idiom.
{
  const fnStart = code.indexOf('Game.LoadMinigames=function()');
  if (fnStart !== -1) {
    const varMe = code.indexOf('var me=Game.Objects[i];', fnStart);
    if (varMe !== -1 && varMe - fnStart < 300) {
      code =
        code.slice(0, varMe) +
        'const me=Game.Objects[i];' +
        code.slice(varMe + 'var me=Game.Objects[i];'.length);
    } else {
      throw new Error('LoadMinigames loop `var me` not found near function head');
    }
  }
}

// 4b. CC3 version badge: render the numeric version with a 3-digit tail.
if (code.includes("'v. '+Game.version+")) {
  code = code.replace("'v. '+Game.version+", "'v. '+Game.version.toFixed(3)+");
}

// 4c. getBounds(): modern getBoundingClientRect() returns an immutable
// DOMRect; the original mutated it in place, which modern browsers accept
// only in sloppy mode (silent no-op). Compute a fresh plain object instead,
// which also makes Game.scale actually take effect.
{
  const old =
    "Element.prototype.getBounds=function(){\n" +
    "\tvar bounds=this.getBoundingClientRect();\n" +
    "\tvar s=Game.scale;\n" +
    "\tbounds.x/=s;\n" +
    "\tbounds.y/=s;\n" +
    "\tbounds.width/=s;\n" +
    "\tbounds.height/=s;\n" +
    "\tbounds.top/=s;\n" +
    "\tbounds.bottom/=s;\n" +
    "\tbounds.left/=s;\n" +
    "\tbounds.right/=s;\n" +
    "\treturn bounds;\n" +
    "};";
  const neu =
    "Element.prototype.getBounds=function(){\n" +
    "\t// CC3: getBoundingClientRect() returns an immutable DOMRect in\n" +
    "\t// modern browsers; compute scaled values in a fresh plain object.\n" +
    "\tvar r=this.getBoundingClientRect();\n" +
    "\tvar s=Game.scale;\n" +
    "\treturn {x:r.x/s,y:r.y/s,width:r.width/s,height:r.height/s,top:r.top/s,bottom:r.bottom/s,left:r.left/s,right:r.right/s};\n" +
    "};";
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes('// CC3: getBoundingClientRect() returns an immutable DOMRect in'))
    throw new Error('getBounds patch anchor not found');
}

// 4d. Seeded RNG (seedrandom): the top-level IIFE is invoked with `this` as its
// first argument. In a classic script that is `window`; in an ES module the
// top-level `this` is `undefined`, so the no-arg `Math.seedrandom()` path
// (which reads `a.crypto`) crashed. Pass `window` explicitly.
{
  const old = 'm(c.random(),b)})(this,[],Math,256,6,52);';
  const neu = 'm(c.random(),b)})(window,[],Math,256,6,52);';
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes('(window,[],Math,256,6,52)'))
    throw new Error('seedrandom `this` patch anchor not found');
}

// 4e. crateTooltip: `mysterious` was assigned without `var` (an implicit
// global in the original). `Game.crate` has its own local `var mysterious`,
// so this leaked to window in sloppy mode; in strict-mode ESM the bare
// assignment is a ReferenceError. Make it local to crateTooltip.
{
  const old = 'var tags=[];\n\t\t\tmysterious=0;\n\t\t\tvar neuromancy=0;';
  const neu = 'var tags=[];\n\t\t\tvar mysterious=0;\n\t\t\tvar neuromancy=0;';
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes('var mysterious=0;'))
    throw new Error('mysterious patch anchor not found');
}

// 4f. Stats "Running version": render the version with toFixed(3) so it shows
// "3.000" (matching the top bar) instead of the bare number "3".
// (Double-quoted so the literal keeps its `+` concatenation operators intact.)
{
  const old = "loc(\"Running version:\")+'</b> '+Game.version+'</div>'+";
  const neu = "loc(\"Running version:\")+'</b> '+Game.version.toFixed(3)+'</div>'+";
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes(neu))
    throw new Error('Running version patch anchor not found');
}

// 4g. grabProps: `arr2` was assigned without `var` (an implicit global in the
// original; every other `arr2` in the file is a properly declared local).
// In strict-mode ESM the bare assignment is a ReferenceError. Make it local.
{
  const old = 'if (!arr) return [];\n\tarr2=[];\n\tfor (var i=0;i<arr.length;i++)';
  const neu = 'if (!arr) return [];\n\tvar arr2=[];\n\tfor (var i=0;i<arr.length;i++)';
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes('var arr2=[];'))
    throw new Error('grabProps arr2 patch anchor not found');
}

// 4h. CalculateGains: `name` was assigned without `var` (an implicit global in
// the original; the parallel bakery-name check elsewhere declares its own local
// `var name`). Being a built-in (`window.name`) it did not throw but silently
// set the window name to the bakery name. Make it local.
{
  const old = "name=Game.bakeryName.toLowerCase();\n\t\t\tif (name=='orteil') mult*=0.99;";
  const neu = "var name=Game.bakeryName.toLowerCase();\n\t\t\tif (name=='orteil') mult*=0.99;";
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes(neu))
    throw new Error('CalculateGains name patch anchor not found');
}

// 4i. Sugar frenzy clickFunction: `buff` was assigned without `var` (an implicit
// global in the original; the golden-cookie handler declares its own local
// `var buff`). In strict-mode ESM the bare assignment is a ReferenceError.
// Make it local.
{
  const old = "Game.Upgrades['Sugar frenzy'].buy(1);\n\t\t\tbuff=Game.gainBuff('sugar frenzy',60*60,3);";
  const neu = "Game.Upgrades['Sugar frenzy'].buy(1);\n\t\t\tvar buff=Game.gainBuff('sugar frenzy',60*60,3);";
  if (code.includes(old)) code = code.replace(old, neu);
  else if (!code.includes("var buff=Game.gainBuff('sugar frenzy',60*60,3);"))
    throw new Error('Sugar frenzy buff patch anchor not found');
}

// 5. Publish the engine globals for cross-module free-variable resolution
//    (minigame modules) and for the legacy mod API (Game.LoadMod scripts).
{
  const names = [...new Set([...implicit, ...declared])];
  const shim = [
    '',
    '/* =====================================================================',
    ' * CC3: engine globals shim. The 2.048 engine was a single classic script,',
    ' * so every top-level binding was global. The minigame modules and the',
    ' * legacy mod loader still resolve their free variables against window,',
    ' * so we republish the engine surface here.',
    ' * ===================================================================== */',
    'Object.assign(window, {',
    names.map((n) => `\t${n}`).join(',\n'),
    '});',
    '',
  ].join('\n');
  code = code + shim;
}
// Images ship as WebP: rewrite the engine's img/….png / img/….jpg string
// literal refs to .webp (converted assets live in public/img), plus the
// variable+quoted-extension refs (concatExtFixes).
// Order matters: applyConcatExt must run before rewriteBareFilenames, which
// would otherwise rewrite art.base+'Background.png' first and hide the exact
// concat pattern (the throw in applyConcatExt would then fire).
code = applyMinLayoutW(code);
code = toWebP(code);
code = applyConcatExt(code);
code = rewriteBareFilenames(code);
writeFileSync(mainPath, code);
console.log('wrote', mainPath);

/* --------------------------------------------------------------- minigames */
for (const file of readdirSync(SRC)) {
  if (!/^minigame.*\.js$/.test(file)) continue;
  let m = stripBom(readFileSync(join(SRC, file), 'utf8'));
  // Market goodTooltip: `icon` was assigned without `var` (an implicit global in
  // the original; the sibling tradeTooltip and other tooltips declare `var icon`).
  // In strict-mode ESM the bare assignment is a ReferenceError. Make it local.
  if (file === 'minigameMarket.js') {
    const old = 'var val=M.getGoodPrice(me)\n\t\t\t\ticon=me.icon||[0,0];';
    const neu = 'var val=M.getGoodPrice(me)\n\t\t\t\tvar icon=me.icon||[0,0];';
    if (m.includes(old)) m = m.replace(old, neu);
    else if (!m.includes(neu))
      throw new Error('minigameMarket icon patch anchor not found');
  }
  const imp = implicitGlobals(m);
  const header =
    imp.length > 0
      ? `/* CC3: the original relied on implicit globals; declare them for module strict mode. */\nvar ${imp.join(', ')};\n\n`
      : '';
  if (imp.length) m = header + m;
  m = toWebP(m); // images ship as WebP (see toWebP above)
  m = rewriteBareFilenames(m);
  writeFileSync(join(ENG, file), m);
  console.log(`wrote ${file} (implicit: ${imp.join(', ') || 'none'})`);
}

/* -------------------------------------------------------------------- loc */
const locDir = join(ENG, 'loc');
mkdirSync(locDir, { recursive: true });
for (const file of readdirSync(join(SRC, 'loc'))) {
  if (!/^[\w-]+\.js$/.test(file)) continue;
  let s = stripBom(readFileSync(join(SRC, 'loc', file), 'utf8')).trim();
  const open = s.match(/^AddLanguage\('([^']+)','([^']+)',\{$/m);
  if (!open) throw new Error(`loc format not recognized in ${file}`);
  const [, id, name] = open;
  if (!s.endsWith('});')) throw new Error(`loc closing not recognized in ${file}`);
  const body = s.slice(s.indexOf(open[0]) + open[0].length, s.length - '});'.length);
  const out = [
    `/* CC3 language module for "${name}" (ported from the 2.048 loc/${file} file).`,
    ` * The engine's AddLanguage() consumes { id, name, strings } at boot. */`,
    `export default { id: ${JSON.stringify(id)}, name: ${JSON.stringify(name)}, strings: {`,
    body,
    '}\n};',
  ].join('\n');
  writeFileSync(join(locDir, file), toWebP(out));
  console.log('wrote loc/' + file);
}

console.log('transform complete');
