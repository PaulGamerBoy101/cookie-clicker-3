// Static scan for strict-mode "assignment to undeclared variable" bugs.
// Walks the AST with a function-scope chain; flags any write to a bare
// identifier that is not declared in the current scope or any enclosing scope.
import { parse } from 'acorn';
import { readFileSync } from 'fs';

const file = process.argv[2];
const code = readFileSync(file, 'utf8');
let ast;
try {
  ast = parse(code, { ecmaVersion: 2022, sourceType: 'module', locations: true });
} catch (e) {
  console.error('PARSE ERROR:', e.message);
  process.exit(2);
}

const META = new Set(['type','start','end','loc','range']);
const isFn = (n) => n && (n.type==='FunctionDeclaration'||n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression');

// Add the binding names introduced by a Pattern / Identifier to a Set.
function collectBindings(node, names) {
  if (!node) return;
  switch (node.type) {
    case 'Identifier': names.add(node.name); break;
    case 'RestElement': collectBindings(node.argument, names); break;
    case 'AssignmentPattern': collectBindings(node.left, names); break;
    case 'ArrayPattern': for (const el of node.elements) if (el) collectBindings(el, names); break;
    case 'ObjectPattern':
      for (const p of node.properties) {
        if (p.type==='RestElement') collectBindings(p.argument, names);
        else collectBindings(p.value, names);
      }
      break;
  }
}

// Visit every node under `root` EXCEPT the interior of nested functions.
// Calls fn(node) for each visited node. Used to collect one scope's own declarations.
function walkShallow(root, fn) {
  (function rec(node) {
    if (!node || typeof node.type !== 'string') return;
    fn(node);
    if (isFn(node)) return; // record handled by fn; never descend into nested fns
    for (const key of Object.keys(node)) {
      if (META.has(key)) continue;
      const c = node[key];
      if (Array.isArray(c)) { for (const x of c) if (x && typeof x.type==='string') rec(x); }
      else if (c && typeof c.type==='string') rec(c);
    }
  })(root);
}

// Names declared in the own scope of a function (params + non-nested declarations).
function functionOwnScope(fn) {
  const names = new Set();
  for (const p of fn.params) collectBindings(p, names);
  walkShallow(fn.body, (n) => {
    if (n.type==='VariableDeclarator') collectBindings(n.id, names);
    else if (n.type==='FunctionDeclaration' && n.id) names.add(n.id.name);
    else if (n.type==='ClassDeclaration' && n.id) names.add(n.id.name);
    else if (n.type==='CatchClause' && n.param) collectBindings(n.param, names);
  });
  return names;
}

// Names declared in the module (top) scope: imports + top-level declarations.
function moduleOwnScope(prog) {
  const names = new Set();
  for (const stmt of prog.body) {
    if (stmt.type==='ImportDeclaration') {
      for (const s of stmt.specifiers) names.add(s.local.name);
    } else walkShallow(stmt, (n) => {
      if (n.type==='VariableDeclarator') collectBindings(n.id, names);
      else if (n.type==='FunctionDeclaration' && n.id) names.add(n.id.name);
      else if (n.type==='ClassDeclaration' && n.id) names.add(n.id.name);
    });
  }
  return names;
}

// Extract the bare-identifier write targets from an LHS (assignment / for-in-left).
function extractTargets(lhs, out) {
  if (!lhs) return;
  switch (lhs.type) {
    case 'Identifier': out.push(lhs); break;
    case 'MemberExpression': break; // property write; base is a read, not flagged here
    case 'ArrayPattern': for (const el of lhs.elements) if (el) extractTargets(el, out); break;
    case 'ObjectPattern':
      for (const p of lhs.properties) {
        if (p.type==='RestElement') extractTargets(p.argument, out);
        else extractTargets(p.value, out);
      }
      break;
    case 'AssignmentPattern': extractTargets(lhs.left, out); break;
    case 'RestElement': extractTargets(lhs.argument, out); break;
  }
}

const SPECIAL = new Set(['arguments','this','undefined']);
const reports = [];

function checkNode(node, scopeStack) {
  if (!node || typeof node.type !== 'string') return;

  if (isFn(node)) {
    scopeStack.push(functionOwnScope(node));
    for (const p of node.params) checkNode(p, scopeStack);
    checkNode(node.body, scopeStack);
    scopeStack.pop();
    return;
  }

  // write targets
  if (node.type==='AssignmentExpression') {
    const t = [];
    extractTargets(node.left, t);
    for (const id of t) if (!SPECIAL.has(id.name) && !scopeStack.some(s=>s.has(id.name)))
      reports.push({ name:id.name, line:node.loc.start.line, op:node.operator });
  } else if (node.type==='UpdateExpression') {
    const a = node.argument;
    if (a && a.type==='Identifier' && !SPECIAL.has(a.name) && !scopeStack.some(s=>s.has(a.name)))
      reports.push({ name:a.name, line:node.loc.start.line, op:node.operator });
  } else if (node.type==='ForInStatement' || node.type==='ForOfStatement') {
    if (node.left.type!=='VariableDeclaration') { // `for (x in y)` without var
      const t = [];
      extractTargets(node.left, t);
      for (const id of t) if (!SPECIAL.has(id.name) && !scopeStack.some(s=>s.has(id.name)))
        reports.push({ name:id.name, line:node.loc.start.line, op:'for-in/of' });
    }
  }

  for (const key of Object.keys(node)) {
    if (META.has(key)) continue;
    const c = node[key];
    if (Array.isArray(c)) { for (const x of c) if (x && typeof x.type==='string') checkNode(x, scopeStack); }
    else if (c && typeof c.type==='string') checkNode(c, scopeStack);
  }
}

const scopeStack = [moduleOwnScope(ast)];
for (const stmt of ast.body) checkNode(stmt, scopeStack);

// de-dup by name+line
const seen = new Set();
const uniq = reports.filter(r => { const k=r.name+'@'+r.line; if (seen.has(k)) return false; seen.add(k); return true; });

if (uniq.length===0) { console.log('No implicit-global assignments found.'); }
else {
  console.log(`Found ${uniq.length} undeclared-assignment candidate(s):\n`);
  for (const r of uniq) console.log(`  ${r.name}  (line ${r.line}, ${r.op})`);
}
