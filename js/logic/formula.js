/**
 * Formules propositionnelles (∨, ¬, ⊃) — écrit maison pour Camille.
 * ⊃ est l'implication ; p ⊃ q ≜ ¬p ∨ q (Principia).
 */

export function v(name) {
  return { type: 'var', name };
}

export function not(arg) {
  return { type: 'not', arg };
}

export function or(left, right) {
  return { type: 'or', left, right };
}

export function imp(left, right) {
  return { type: 'imp', left, right };
}

/** Pretty-print accessible (français / symboles). */
export function pretty(f) {
  return _pretty(f, 0);
}

function _pretty(f, prec) {
  switch (f.type) {
    case 'var':
      return f.name;
    case 'not': {
      const inner = _pretty(f.arg, 3);
      return `¬${inner}`;
    }
    case 'or': {
      const s = `${_pretty(f.left, 1)} ∨ ${_pretty(f.right, 1)}`;
      return prec > 1 ? `(${s})` : s;
    }
    case 'imp': {
      const s = `${_pretty(f.left, 2)} ⊃ ${_pretty(f.right, 2)}`;
      return prec > 1 ? `(${s})` : s;
    }
    default:
      throw new Error(`formule inconnue: ${f.type}`);
  }
}

/** Égalité structurelle. */
export function eq(a, b) {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'var':
      return a.name === b.name;
    case 'not':
      return eq(a.arg, b.arg);
    case 'or':
    case 'imp':
      return eq(a.left, b.left) && eq(a.right, b.right);
    default:
      return false;
  }
}

/** Remplace chaque variable selon map { p: formule, ... }. */
export function substitute(f, map) {
  switch (f.type) {
    case 'var':
      return map[f.name] ? clone(map[f.name]) : v(f.name);
    case 'not':
      return not(substitute(f.arg, map));
    case 'or':
      return or(substitute(f.left, map), substitute(f.right, map));
    case 'imp':
      return imp(substitute(f.left, map), substitute(f.right, map));
    default:
      throw new Error(`formule inconnue: ${f.type}`);
  }
}

export function clone(f) {
  return substitute(f, {});
}

/**
 * Parse une chaîne simple.
 * Syntaxe : variables [a-z], ~ ou ¬, | ou ∨, > ou ⊃, parenthèses.
 * Priorité : ¬ > ∨ > ⊃ (⊃ associative à droite).
 */
export function parse(input) {
  const s = String(input)
    .replace(/\s+/g, '')
    .replace(/¬/g, '~')
    .replace(/∨/g, '|')
    .replace(/⊃/g, '>');
  let i = 0;

  function peek() {
    return s[i];
  }
  function eat(ch) {
    if (s[i] !== ch) throw new Error(`attendu '${ch}' dans « ${input} » à ${i}`);
    i++;
  }

  function parseImp() {
    let left = parseOr();
    while (peek() === '>') {
      eat('>');
      const right = parseImp();
      left = imp(left, right);
    }
    return left;
  }

  function parseOr() {
    let left = parseUnary();
    while (peek() === '|') {
      eat('|');
      const right = parseUnary();
      left = or(left, right);
    }
    return left;
  }

  function parseUnary() {
    if (peek() === '~') {
      eat('~');
      return not(parseUnary());
    }
    return parseAtom();
  }

  function parseAtom() {
    if (peek() === '(') {
      eat('(');
      const inner = parseImp();
      eat(')');
      return inner;
    }
    if (peek() && /[a-z]/i.test(peek())) {
      const name = peek().toLowerCase();
      i++;
      return v(name);
    }
    throw new Error(`atome inattendu dans « ${input} » à ${i}`);
  }

  const result = parseImp();
  if (i !== s.length) throw new Error(`reste non parsé dans « ${input} »: ${s.slice(i)}`);
  return result;
}

/** Collecte les noms de variables (ordre d'apparition). */
export function freeVars(f, out = []) {
  switch (f.type) {
    case 'var':
      if (!out.includes(f.name)) out.push(f.name);
      break;
    case 'not':
      freeVars(f.arg, out);
      break;
    case 'or':
    case 'imp':
      freeVars(f.left, out);
      freeVars(f.right, out);
      break;
  }
  return out;
}
