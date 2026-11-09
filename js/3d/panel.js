/**
 * Panneaux HTML par-dessus le canvas : quiz, histoire, preuves, aide.
 */
import { CH1, CH2, CH3, CH5 } from '../chapters/content.js';
import { applyQuizChoice, quizCanAdvance } from '../quiz.js';
import { PROOFS, pretty } from '../logic/proofs.js';
import { tryRule, RULE_LABELS } from '../logic/engine.js';
import { eq } from '../logic/formula.js';
import { makeArena, placeTile, TILE_LABELS } from './tiles.js';
import { growProofTree, clearProofTree } from './proof-view.js';

const CONTENT = { ch1: CH1, ch2: CH2, ch3: CH3, ch5: CH5 };

export function makePanel({ root, onClose, onChapterDone, onProofDone, getProofTree }) {
  const el = root;
  let mode = null; // chapter | proof | talk
  let chapterId = null;
  let pageIndex = 0;
  let quizAnswered = null;
  let quizWrong = null;
  let message = '';
  let tilesTried = new Set();
  let proof = null;
  let proofLines = [];
  let arena = null;
  let hintLevel = 0;

  function hide() {
    mode = null;
    el.classList.add('hidden');
    el.innerHTML = '';
    onClose && onClose();
  }

  function showChapter(id) {
    chapterId = id;
    pageIndex = 0;
    quizAnswered = null;
    quizWrong = null;
    message = '';
    tilesTried = new Set();
    mode = 'chapter';
    render();
  }

  function showTalk(text) {
    mode = 'talk';
    el.classList.remove('hidden');
    el.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `<p class="eyebrow">Rencontre</p><p>${escapeHtml(text)}</p>`;
    const btn = document.createElement('button');
    btn.className = 'primary';
    btn.textContent = 'OK';
    btn.onclick = hide;
    card.appendChild(btn);
    el.appendChild(card);
  }

  function showProof(proofId) {
    proof = PROOFS.find((p) => p.id === proofId);
    if (!proof) return;
    proofLines = proof.initials.map((f, i) => ({
      formula: f,
      rule: 'donné',
      note: proof.initialNotes[i] || '',
    }));
    arena = makeArena(proof);
    hintLevel = 0;
    message = 'Touche une tuile pour l’étape suivante.';
    mode = 'proof';
    const tree = getProofTree && getProofTree();
    if (tree) growProofTree(tree, proofLines);
    render();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function render() {
    el.classList.remove('hidden');
    el.innerHTML = '';
    if (mode === 'chapter') return renderChapter();
    if (mode === 'proof') return renderProof();
  }

  function renderChapter() {
    const content = CONTENT[chapterId];
    if (!content) {
      // ch4 hub handled outside
      hide();
      return;
    }
    const page = content.pages[pageIndex];
    const total = content.pages.length;
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `<p class="eyebrow">Chapitre · ${pageIndex + 1}/${total}</p><h2>${escapeHtml(page.title)}</h2>`;

    if (page.kind === 'story') {
      for (const para of page.body.split('\n\n')) {
        const p = document.createElement('p');
        p.className = 'story';
        p.textContent = para;
        card.appendChild(p);
      }
    }

    if (page.kind === 'quiz') {
      const q = document.createElement('p');
      q.className = 'story';
      q.textContent = page.question;
      card.appendChild(q);
      const choices = document.createElement('div');
      choices.className = 'choices';
      const locked = quizAnswered != null;
      for (const c of page.choices) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice'
          + (quizAnswered === c.id ? ' selected' : '')
          + (locked && c.ok ? ' correct' : '')
          + (!locked && quizWrong === c.id ? ' wrong' : '');
        b.disabled = locked;
        b.textContent = c.text;
        b.onclick = () => {
          const r = applyQuizChoice({ choice: c, explain: page.explain });
          quizAnswered = r.quizAnswered;
          quizWrong = r.quizWrong;
          message = r.message;
          render();
        };
        choices.appendChild(b);
      }
      card.appendChild(choices);
    }

    if (page.kind === 'tiles') {
      const intro = document.createElement('p');
      intro.className = 'story';
      intro.textContent = page.body;
      card.appendChild(intro);
      const row = document.createElement('div');
      row.className = 'tile-row';
      for (const t of page.tiles) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rule-tile' + (tilesTried.has(t.id) ? ' tried' : '');
        b.textContent = t.label;
        b.onclick = () => {
          tilesTried.add(t.id);
          message = t.demo;
          render();
        };
        row.appendChild(b);
      }
      card.appendChild(row);
    }

    if (message) {
      const fb = document.createElement('p');
      fb.className = 'feedback';
      fb.setAttribute('role', 'status');
      fb.textContent = message;
      card.appendChild(fb);
    }

    const nav = document.createElement('div');
    nav.className = 'pager';
    const back = document.createElement('button');
    back.className = 'ghost';
    back.textContent = pageIndex === 0 ? 'Fermer' : '←';
    back.onclick = () => {
      if (pageIndex === 0) hide();
      else {
        pageIndex -= 1;
        quizAnswered = null;
        quizWrong = null;
        message = '';
        render();
      }
    };
    nav.appendChild(back);

    const canAdvance = (() => {
      if (page.kind === 'quiz') return quizCanAdvance(quizAnswered, page.choices);
      if (page.kind === 'tiles') return tilesTried.size >= page.tiles.length;
      return true;
    })();
    const last = pageIndex >= total - 1;
    const next = document.createElement('button');
    next.className = 'primary';
    next.disabled = !canAdvance;
    next.textContent = last ? 'Terminer ✓' : 'Continuer';
    next.onclick = () => {
      if (!last) {
        pageIndex += 1;
        quizAnswered = null;
        quizWrong = null;
        message = '';
        render();
        return;
      }
      onChapterDone && onChapterDone(chapterId);
      hide();
    };
    nav.appendChild(next);
    card.appendChild(nav);
    el.appendChild(card);
  }

  function renderProof() {
    const card = document.createElement('div');
    card.className = 'panel-card wide';
    card.innerHTML = `<p class="eyebrow">Preuve ${escapeHtml(proof.code)}</p>
      <h2>${escapeHtml(proof.goalDisplay || pretty(proof.goal))}</h2>
      <p class="story">${escapeHtml(proof.blurb)}</p>`;

    const tree = document.createElement('ol');
    tree.className = 'tree-lines';
    proofLines.forEach((line, i) => {
      const li = document.createElement('li');
      if (eq(line.formula, proof.goal)) li.classList.add('goal-hit');
      li.innerHTML = `<span class="line-idx">(${i})</span> <code>${escapeHtml(pretty(line.formula))}</code>
        <span class="line-rule">${escapeHtml(line.rule === 'donné' ? line.note || 'donné' : RULE_LABELS[line.rule] || line.rule)}</span>`;
      tree.appendChild(li);
    });
    card.appendChild(tree);

    const row = document.createElement('div');
    row.className = 'tile-row';
    for (const id of ['substitution', 'detachment', 'chain']) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rule-tile';
      b.textContent = TILE_LABELS[id];
      b.onclick = () => applyTile(id);
      row.appendChild(b);
    }
    card.appendChild(row);

    if (message) {
      const fb = document.createElement('p');
      fb.className = 'feedback';
      fb.textContent = message;
      card.appendChild(fb);
    }

    const help = document.createElement('div');
    help.className = 'helpbar';
    const hint = document.createElement('button');
    hint.className = 'ghost';
    hint.textContent = hintLevel === 0 ? 'Indice' : hintLevel === 1 ? 'Montrer la réponse' : 'Aide ouverte';
    hint.onclick = () => {
      hintLevel = Math.min(2, hintLevel + 1);
      const step = proof.solution[arena.step];
      if (hintLevel === 1) {
        message = `Indice : ${proof.hints[Math.min(arena.step, proof.hints.length - 1)]}`;
      } else if (step) {
        message = `Réponse : « ${TILE_LABELS[step.rule]} ». ${step.note || ''}`;
      }
      render();
    };
    const close = document.createElement('button');
    close.className = 'ghost';
    close.textContent = 'Fermer';
    close.onclick = hide;
    help.append(hint, close);
    card.appendChild(help);

    if (arena.done || proofLines.some((l) => eq(l.formula, proof.goal))) {
      const ok = document.createElement('div');
      ok.className = 'ok-banner';
      ok.innerHTML = '<strong>Preuve trouvée !</strong>';
      const doneBtn = document.createElement('button');
      doneBtn.className = 'primary';
      doneBtn.textContent = 'Continuer';
      doneBtn.onclick = () => {
        onProofDone && onProofDone(proof.id);
        hide();
      };
      ok.appendChild(doneBtn);
      card.appendChild(ok);
    }

    el.appendChild(card);
  }

  function applyTile(tileId) {
    if (!arena || arena.done) return;
    const next = placeTile(arena, tileId);
    if (next.lastError) {
      arena = next;
      message = next.lastError;
      render();
      return;
    }
    arena = next;
    const step = proof.solution[arena.step - 1];
    const premises = step.from.map((i) => proofLines[i].formula);
    const outcome = tryRule(step.rule, premises, step.subst || {});
    if (outcome.ok) {
      proofLines.push({ formula: outcome.result, rule: step.rule, note: step.note || '' });
      const tree = getProofTree && getProofTree();
      if (tree) growProofTree(tree, proofLines);
      message = step.note || `Bien joué : ${TILE_LABELS[tileId]}.`;
    } else {
      message = outcome.error || 'Étape impossible.';
    }
    hintLevel = 0;
    render();
  }

  function showProofHub(save, openProof) {
    mode = 'hub';
    el.classList.remove('hidden');
    el.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `<p class="eyebrow">Chapitre 4</p><h2>Prouve comme LT</h2>
      <p class="story">JOHNNIAC t’attend près du socle. Choisis une preuve ; les tuiles font grandir l’arbre dans la salle.</p>`;
    PROOFS.forEach((p, idx) => {
      const done = !!save.proofs[p.id];
      const prevOk = idx === 0 || !!save.proofs[PROOFS[idx - 1].id];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chapter-card' + (done ? ' done' : '') + (!prevOk ? ' locked' : '');
      b.disabled = !prevOk;
      b.innerHTML = `<strong>${escapeHtml(p.code)} · ${escapeHtml(p.title)}</strong>`;
      b.onclick = () => openProof(p.id);
      card.appendChild(b);
    });
    const close = document.createElement('button');
    close.className = 'ghost';
    close.textContent = 'Fermer';
    close.onclick = hide;
    card.appendChild(close);
    el.appendChild(card);
  }

  return {
    hide,
    showChapter,
    showTalk,
    showProof,
    showProofHub,
    get open() { return mode != null; },
  };
}
