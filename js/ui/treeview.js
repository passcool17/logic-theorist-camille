/**
 * Affiche le modèle d’arbre (proofplay.buildTree) en HTML + un SVG pour les traits.
 * Traits pleins verts vers les étapes valides, pointillés gris vers les essais rejetés.
 */

import { laurelSVG, RULE_ICONS } from './art.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Coupe « A ⊃ B » au connecteur principal (hors parenthèses) pour tenir en deux lignes. */
export function splitMain(label) {
  let depth = 0;
  for (let i = 0; i < label.length; i++) {
    const c = label[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0 && (c === '⊃' || c === '∨') && label[i - 1] === ' ') {
      return [label.slice(0, i + 1).trim(), label.slice(i + 1).trim()];
    }
  }
  return [label];
}

/** Découpe une formule longue en lignes courtes, en suivant sa structure. */
export function breakLines(label, maxLen = 14) {
  const t = label.trim();
  if (t.length <= maxLen) return [t];
  const suf = t.match(/ (⊃|∨)$/);
  if (suf) {
    const rest = breakLines(t.slice(0, -2), maxLen);
    rest[rest.length - 1] += suf[0];
    return rest;
  }
  const parts = splitMain(t);
  if (parts.length === 2 && parts[1]) return [...breakLines(parts[0], maxLen), ...breakLines(parts[1], maxLen)];
  if (t.startsWith('(') && t.endsWith(')')) {
    let depth = 0;
    let closesAtEnd = true;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '(') depth++;
      else if (t[i] === ')') depth--;
      if (depth === 0 && i < t.length - 1) { closesAtEnd = false; break; }
    }
    if (closesAtEnd) {
      const inner = breakLines(t.slice(1, -1), maxLen - 1);
      inner[0] = `(${inner[0]}`;
      inner[inner.length - 1] += ')';
      return inner;
    }
  }
  return [t];
}

function nodeEl(n) {
  const wrap = document.createElement('div');
  wrap.className = 'tn-wrap';
  const box = document.createElement('div');
  const long = n.kind !== 'reject' && n.label.length > 9 ? ' long' : '';
  box.className = `tn tn-${n.kind}${long}`;
  box.dataset.key = n.key;
  const mark = n.kind === 'reject' ? '✕' : n.kind === 'pending' ? '' : '✓';
  const label = document.createElement('span');
  label.className = 'tn-f';
  if (n.kind === 'reject' && n.rule && n.label.length > 5) {
    // Essai rejeté au long libellé : petite icône de la règle, nom complet au survol / lecteur d’écran.
    label.classList.add('tn-icon');
    label.innerHTML = RULE_ICONS[n.rule] || '';
    box.title = n.label;
    box.setAttribute('aria-label', `${n.label} : rejeté`);
  } else if (long) {
    for (const part of breakLines(n.label, 9)) {
      const line = document.createElement('span');
      line.className = 'tn-line';
      line.textContent = part;
      label.append(line);
    }
  } else {
    label.textContent = n.label;
  }
  box.append(label);
  if (mark) {
    const m = document.createElement('span');
    m.className = 'tn-mark';
    m.textContent = mark;
    m.setAttribute('aria-label', n.kind === 'reject' ? 'rejeté' : 'validé');
    box.append(m);
  }
  wrap.append(box);
  if (n.children.length) {
    const kids = document.createElement('div');
    kids.className = 'tn-kids';
    n.children.forEach((c) => kids.append(nodeEl(c)));
    wrap.append(kids);
  }
  return wrap;
}

function edges(n, out = []) {
  for (const c of n.children) {
    out.push([n.key, c.key, c.kind === 'reject' ? 'reject' : 'ok']);
    edges(c, out);
  }
  return out;
}

/** Construit l’arbre ; retourne l’élément et une fonction qui (re)trace les traits. */
export function renderTree(model, { code } = {}) {
  const root = document.createElement('div');
  root.className = `proof-tree${model.solved ? ' solved' : ''}`;
  root.setAttribute('aria-label', 'Arbre de preuve');

  const target = document.createElement('div');
  target.className = 'tn-target-row';
  target.innerHTML = `${laurelSVG('left')}<div class="tn tn-target" data-key="goal"><span class="tn-code"></span><span class="tn-f"></span></div>${laurelSVG('right')}`;
  target.querySelector('.tn-code').textContent = code ? `Preuve ${code}` : 'But';
  const goalF = target.querySelector('.tn-f');
  for (const part of breakLines(model.goal, 16)) {
    const line = document.createElement('span');
    line.className = 'tn-line';
    line.textContent = part;
    goalF.append(line);
  }
  root.append(target);

  const tree = nodeEl(model.root);
  tree.classList.add('tn-rootwrap');
  root.append(tree);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'tn-edges');
  svg.setAttribute('aria-hidden', 'true');
  root.prepend(svg);

  const list = [['goal', model.root.key, model.solved ? 'ok' : 'wait'], ...edges(model.root)];

  function draw() {
    // Réduit l’arbre pour qu’il tienne dans sa colonne (sans défilement horizontal).
    tree.style.transform = '';
    tree.style.marginBottom = '';
    tree.style.marginLeft = '';
    const avail = root.clientWidth;
    const need = tree.scrollWidth;
    if (avail && need > avail) {
      const s = Math.max(0.5, avail / need);
      tree.style.transformOrigin = 'top left';
      tree.style.transform = `scale(${s})`;
      tree.style.marginBottom = `${-(1 - s) * tree.offsetHeight}px`;
      tree.style.marginLeft = `${Math.max(0, (avail - need * s) / 2)}px`;
    }
    const box = root.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);
    svg.textContent = '';
    for (const [a, b, kind] of list) {
      const A = root.querySelector(`[data-key="${a}"]`);
      const B = root.querySelector(`[data-key="${b}"]`);
      if (!A || !B) continue;
      const ra = A.getBoundingClientRect();
      const rb = B.getBoundingClientRect();
      const x1 = ra.left + ra.width / 2 - box.left;
      const y1 = ra.bottom - box.top;
      const x2 = rb.left + rb.width / 2 - box.left;
      const y2 = rb.top - box.top;
      const p = document.createElementNS(SVG_NS, 'path');
      const my = (y1 + y2) / 2;
      p.setAttribute('d', kind === 'reject' || kind === 'wait'
        ? `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`
        : `M${x1} ${y1} L${x2} ${y2}`);
      p.setAttribute('class', `edge edge-${kind}`);
      svg.append(p);
    }
  }
  return { el: root, draw };
}
