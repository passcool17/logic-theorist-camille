/**
 * Logic Theorist Camille — interface 2D illustrée (maquette sauge/crème).
 * Mobile d’abord, français québécois. La logique du jeu est inchangée :
 * moteur dans js/logic, mode guidé dans js/proofplay.js.
 */

import { CHAPTERS, BADGE_INFO } from './chapters.js';
import { CH1, CH2, CH3, CH5 } from './chapters/content.js';
import { PROOFS, pretty } from './logic/proofs.js';
import { RULE_LABELS } from './logic/engine.js';
import {
  loadSave,
  writeSave,
  markChapterDone,
  markProofDone,
  progressSummary,
} from './save.js';
import { applyQuizChoice, quizCanAdvance } from './quiz.js';
import { initialLines, guidedTry, goalReached, buildTree, ch4StepProgress } from './proofplay.js';
import {
  johnniacSVG,
  johnniacHeadSVG,
  RULE_ICONS,
  CHAPTER_ICONS,
  sprigSVG,
  ribbonSVG,
  landscapeSVG,
} from './ui/art.js';
import { renderTree } from './ui/treeview.js';

const APP_VERSION = 'lt-camille-v8';
const RULES = ['substitution', 'detachment', 'chain'];

let state = {
  save: null,
  screen: 'home', // home | chapter | ch4hub | proof | badges | about
  chapterId: null,
  pageIndex: 0,
  quizAnswered: null,
  quizWrong: null,
  tilesTried: new Set(),
  proofId: null,
  proofLines: [],
  proofStep: 0, // prochaine étape de la solution (mode guidé)
  proofRejects: [], // essais rejetés : { label, rule, at }
  selectedRule: null,
  hintLevel: 0, // 0 rien, 1 indice, 2 réponse
  message: '',
};

let redrawTree = null;

function persist() {
  const r = writeSave(state.save);
  state.save = r.save;
}

function $(sel) {
  return document.querySelector(sel);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === false || v == null) continue;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function go(screen) {
  state.screen = screen;
  state.message = '';
  render();
}
function goHome() {
  go('home');
}

function openChapter(id) {
  state.screen = 'chapter';
  state.chapterId = id;
  state.pageIndex = 0;
  state.quizAnswered = null;
  state.quizWrong = null;
  state.tilesTried = new Set();
  state.hintLevel = 0;
  state.message = '';
  render();
}

function openProof(id) {
  const proof = PROOFS.find((p) => p.id === id);
  state.screen = 'proof';
  state.proofId = id;
  state.proofLines = initialLines(proof);
  state.proofStep = 0;
  state.proofRejects = [];
  state.selectedRule = null;
  state.hintLevel = 0;
  state.message = 'Choisis une règle, puis touche Essayer. La machine s’occupe des lignes.';
  render();
}

function contentFor(chapterId) {
  if (chapterId === 'ch1') return CH1;
  if (chapterId === 'ch2') return CH2;
  if (chapterId === 'ch3') return CH3;
  if (chapterId === 'ch5') return CH5;
  return null;
}

function completeChapter(chapterId) {
  state.save = markChapterDone(state.save, chapterId);
  const meta = CHAPTERS.find((c) => c.id === chapterId);
  if (meta) state.save.chapter = Math.min(5, meta.num + 1);
  persist();
}

/* ---------- éléments communs ---------- */

function progressBar(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return el('div', { className: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(done), 'aria-label': label }, [
    el('span', { className: 'progress-sprig', html: sprigSVG() }),
    el('span', { className: 'progress-track' }, [el('span', { className: 'progress-fill', style: `width:${pct}%` })]),
    el('span', { className: 'progress-count', text: `${done} / ${total}` }),
  ]);
}

function backTarget() {
  if (state.screen === 'proof') return () => go('ch4hub');
  return goHome;
}

function headerTitle() {
  if (state.screen === 'chapter') {
    const ch = CHAPTERS.find((c) => c.id === state.chapterId);
    return ch ? `Chapitre ${ch.num} · ${ch.title}` : '';
  }
  if (state.screen === 'ch4hub' || state.screen === 'proof') return 'Chapitre 4 · Prouve comme LT';
  if (state.screen === 'badges') return 'Carnet de badges';
  if (state.screen === 'about') return 'À propos';
  return 'Logic Theorist';
}

function renderHeader(root) {
  const sum = progressSummary(state.save);
  const home = state.screen === 'home';
  const left = home
    ? el('span', { className: 'logo', html: johnniacHeadSVG(), 'aria-hidden': 'true' })
    : el('button', { type: 'button', className: 'back-btn', 'aria-label': 'Retour', onClick: backTarget(), html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5m6-7-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' });
  root.append(
    el('header', { className: 'topbar' }, [
      left,
      el('h1', { className: 'top-title', text: headerTitle() }),
      home
        ? el('button', { type: 'button', className: 'about-btn', 'aria-label': 'À propos', onClick: () => go('about') }, ['?'])
        : null,
      el('button', {
        type: 'button',
        className: 'ribbon',
        'aria-label': `Carnet de badges : ${sum.badges}`,
        onClick: () => go('badges'),
      }, [el('span', { html: ribbonSVG() }), el('span', { className: 'ribbon-n', text: String(sum.badges) })]),
    ]),
  );
}

function speech(text) {
  return el('div', { className: 'speech', role: 'status' }, [
    el('span', { className: 'speech-face', html: johnniacHeadSVG(), 'aria-hidden': 'true' }),
    el('p', { text }),
  ]);
}

/* ---------- accueil ---------- */

function renderHome(root) {
  const sum = progressSummary(state.save);
  root.append(
    el('section', { className: 'hero card' }, [
      el('div', { className: 'hero-art', html: johnniacSVG({ mood: 'smile', plants: false }) }),
      el('div', { className: 'hero-text' }, [
        el('p', { className: 'eyebrow', text: 'Pour Camille · 13 ans' }),
        el('h2', { className: 'hero-title', text: 'Une machine qui raisonne' }),
        el('p', {
          className: 'lede',
          text: 'Découvre Logic Theorist (1955–56) : le programme de Newell, Simon et Shaw qui a prouvé des théorèmes tout seul.',
        }),
      ]),
    ]),
  );
  root.append(progressBar(sum.chaptersDone, 5, 'Chapitres terminés'));
  if (state.message) root.append(speech(state.message));

  const list = el('div', { className: 'chapter-list' });
  for (const ch of CHAPTERS) {
    const done = !!state.save.completed[ch.id];
    const locked = ch.num > 1 && !state.save.completed[`ch${ch.num - 1}`] && !done;
    const status = done ? '✓' : locked ? '🔒' : '→';
    list.append(
      el('button', {
        type: 'button',
        className: `chapter-card${done ? ' done' : ''}${locked ? ' locked' : ''}`,
        disabled: locked,
        onClick: () => {
          if (ch.id === 'ch4') go('ch4hub');
          else openChapter(ch.id);
        },
      }, [
        el('span', { className: 'chap-icon', html: CHAPTER_ICONS[ch.id] || '' }),
        el('span', { className: 'chap-text' }, [
          el('span', { className: 'chap-num', text: `Chapitre ${ch.num}` }),
          el('strong', { text: ch.title }),
          el('span', { className: 'meta', text: `${ch.duration}${ch.id === 'ch4' ? ` · ${sum.proofsDone}/6 preuves` : ''}` }),
        ]),
        el('span', { className: `chap-status${done ? ' ok' : ''}`, text: status, 'aria-label': done ? 'terminé' : locked ? 'verrouillé' : 'ouvrir' }),
      ]),
    );
  }
  root.append(list);
}

/* ---------- chapitres 1, 2, 3, 5 ---------- */

function renderChapter(root) {
  const ch = CHAPTERS.find((c) => c.id === state.chapterId);
  const content = contentFor(state.chapterId);
  if (!ch || !content) return;

  const page = content.pages[state.pageIndex];
  const total = content.pages.length;
  root.append(progressBar(state.pageIndex + 1, total, 'Pages du chapitre'));

  const body = el('section', { className: 'card page-card' }, [
    el('div', { className: 'page-head' }, [
      el('span', { className: 'chap-icon small', html: CHAPTER_ICONS[ch.id] || '' }),
      el('h2', { text: page.title }),
    ]),
  ]);

  if (page.kind === 'story') {
    for (const para of page.body.split('\n\n')) {
      body.append(el('p', { className: 'story', text: para }));
    }
  }

  if (page.kind === 'quiz') {
    body.append(el('p', { className: 'story question', text: page.question }));
    const choices = el('div', { className: 'choices' });
    const locked = state.quizAnswered != null;
    page.choices.forEach((c, idx) => {
      const selected = state.quizAnswered === c.id;
      const wrongMark = !locked && state.quizWrong === c.id;
      const okMark = locked && c.ok;
      choices.append(
        el('button', {
          type: 'button',
          className: `choice${selected ? ' selected' : ''}${okMark ? ' correct' : ''}${wrongMark ? ' wrong' : ''}`,
          disabled: locked,
          onClick: () => {
            const r = applyQuizChoice({ choice: c, explain: page.explain });
            state.quizAnswered = r.quizAnswered;
            state.quizWrong = r.quizWrong;
            state.message = r.message;
            render();
          },
        }, [
          el('span', { className: 'choice-letter', text: 'ABCDEF'[idx] }),
          el('span', { className: 'choice-text', text: c.text }),
          okMark ? el('span', { className: 'choice-mark ok', text: '✓' }) : wrongMark ? el('span', { className: 'choice-mark no', text: '✕' }) : null,
        ]),
      );
    });
    body.append(choices);
  }

  if (page.kind === 'tiles') {
    body.append(el('p', { className: 'story', text: page.body }));
    const row = el('div', { className: 'tile-col' });
    for (const t of page.tiles) {
      const tried = state.tilesTried.has(t.id);
      row.append(
        el('button', {
          type: 'button',
          className: `rule-tile${tried ? ' tried' : ''}`,
          onClick: () => {
            state.tilesTried.add(t.id);
            state.message = t.demo;
            render();
          },
        }, [
          el('span', { className: 'rule-icon', html: RULE_ICONS[t.id] || '' }),
          el('span', { className: 'rule-name', text: t.label }),
          tried ? el('span', { className: 'rule-check', text: '✓' }) : null,
        ]),
      );
    }
    body.append(row);
    if (state.tilesTried.size >= page.tiles.length) {
      body.append(el('p', { className: 'ok', text: 'Les trois outils sont débloqués. Tu peux continuer.' }));
    }
  }

  root.append(body);
  if (state.message && (page.kind === 'quiz' || page.kind === 'tiles')) root.append(speech(state.message));

  const nav = el('div', { className: 'pager' });
  nav.append(
    el('button', {
      type: 'button',
      className: 'ghost round',
      'aria-label': 'Page précédente',
      disabled: state.pageIndex === 0,
      onClick: () => {
        state.pageIndex -= 1;
        state.quizAnswered = null;
        state.quizWrong = null;
        state.message = '';
        render();
      },
    }, ['←']),
  );

  const canAdvance = (() => {
    if (page.kind === 'quiz') return quizCanAdvance(state.quizAnswered, page.choices);
    if (page.kind === 'tiles') return state.tilesTried.size >= page.tiles.length;
    return true;
  })();

  const last = state.pageIndex >= total - 1;
  nav.append(
    el('button', {
      type: 'button',
      className: 'primary big',
      disabled: !canAdvance,
      onClick: () => {
        if (!last) {
          state.pageIndex += 1;
          state.quizAnswered = null;
          state.quizWrong = null;
          state.message = '';
          state.hintLevel = 0;
          render();
          return;
        }
        completeChapter(ch.id);
        const msg = `Badge « ${ch.badge} » ajouté au carnet.`;
        state.screen = ch.id === 'ch3' ? 'ch4hub' : 'home';
        state.message = msg;
        render();
      },
    }, [last ? 'Terminer ✓' : 'Continuer', el('span', { className: 'btn-arrow', text: '→', 'aria-hidden': 'true' })]),
  );
  root.append(nav);
}

/* ---------- chapitre 4 : choix des preuves ---------- */

function renderCh4Hub(root) {
  const prog = ch4StepProgress(PROOFS, state.save.proofs, null);
  root.append(progressBar(prog.done, prog.total, 'Étapes de preuve du chapitre 4'));
  root.append(
    el('section', { className: 'card hub-hero' }, [
      el('div', { className: 'hub-art', html: johnniacSVG({ mood: 'smile', plants: false, note: false }) }),
      el('div', {}, [
        el('h2', { text: 'Prouve comme LT' }),
        el('p', {
          className: 'story',
          text: 'Six petites preuves des Principia, de plus en plus costaudes. Tu choisis les règles ; JOHNNIAC montre l’arbre.',
        }),
      ]),
    ]),
  );
  if (state.message) root.append(speech(state.message));

  const list = el('div', { className: 'chapter-list' });
  PROOFS.forEach((p, idx) => {
    const done = !!state.save.proofs[p.id];
    const prevOk = idx === 0 || !!state.save.proofs[PROOFS[idx - 1].id];
    list.append(
      el('button', {
        type: 'button',
        className: `chapter-card proof-card${done ? ' done' : ''}${!prevOk ? ' locked' : ''}`,
        disabled: !prevOk,
        onClick: () => openProof(p.id),
      }, [
        el('span', { className: 'code-pill', text: p.code }),
        el('span', { className: 'chap-text' }, [
          el('strong', { className: 'math', text: p.title }),
          el('span', { className: 'meta', text: done ? 'prouvée ✓' : p.blurb.length > 64 ? p.blurb.slice(0, 62) + '…' : p.blurb }),
        ]),
        el('span', { className: `chap-status${done ? ' ok' : ''}`, text: done ? '✓' : !prevOk ? '🔒' : '→' }),
      ]),
    );
  });
  root.append(list);

  const allDone = PROOFS.every((p) => state.save.proofs[p.id]);
  root.append(
    el('div', { className: 'pager' }, [
      el('button', { type: 'button', className: 'ghost', onClick: goHome }, ['Accueil']),
      el('button', {
        type: 'button',
        className: 'primary big',
        disabled: !allDone,
        onClick: () => {
          completeChapter('ch4');
          openChapter('ch5');
        },
      }, [allDone ? 'Chapitre 5 →' : 'Termine les 6 preuves']),
    ]),
  );
}

/* ---------- chapitre 4 : une preuve ---------- */

function renderProof(root) {
  const proof = PROOFS.find((p) => p.id === state.proofId);
  if (!proof) return;
  const done = goalReached(proof, state.proofLines);

  if (done && !state.save.proofs[proof.id]) {
    state.save = markProofDone(state.save, proof.id);
    if (PROOFS.every((p) => state.save.proofs[p.id])) {
      state.save = markChapterDone(state.save, 'ch4');
    }
    persist();
  }

  const prog = ch4StepProgress(PROOFS, state.save.proofs, { id: proof.id, step: state.proofStep });
  root.append(progressBar(prog.done, prog.total, 'Étapes de preuve du chapitre 4'));

  // Scène : JOHNNIAC à gauche, arbre à droite.
  const model = buildTree(proof, state.proofLines, state.proofRejects, 2);
  const goalText = (proof.goalDisplay || pretty(proof.goal)).replace(/\s*\[.*\]\s*$/, '');
  model.goal = goalText;
  const tv = renderTree(model, { code: proof.code });
  redrawTree = tv.draw;
  const mood = done ? 'proud' : state.proofRejects.length && state.proofRejects[state.proofRejects.length - 1].at === state.proofStep ? 'think' : 'smile';
  root.append(
    el('section', { className: 'scene' }, [
      el('div', { className: 'scene-robot', html: johnniacSVG({ mood }) }),
      el('div', { className: 'scene-tree drop-zone' }, [tv.el]),
    ]),
  );

  root.append(speech(done ? 'Preuve trouvée ! L’arbre a atteint le but. JOHNNIAC est fier.' : state.message));

  // Panneau des règles.
  const tiles = el('div', { className: 'tile-col' });
  for (const rule of RULES) {
    const btn = el('button', {
      type: 'button',
      className: `rule-tile${state.selectedRule === rule ? ' selected' : ''}`,
      'aria-pressed': state.selectedRule === rule ? 'true' : 'false',
      disabled: done,
      'data-rule': rule,
      // Clavier / lecteur d’écran ; au doigt ou à la souris, la sélection se fait au pointerup.
      onClick: () => {
        if (performance.now() - lastPointerPick < 600) return;
        selectRule(rule);
      },
    }, [
      el('span', { className: 'rule-icon', html: RULE_ICONS[rule] }),
      el('span', { className: 'rule-name', text: RULE_LABELS[rule] }),
    ]);
    enableDrag(btn, rule, proof);
    tiles.append(btn);
  }

  const tryBtn = el('button', {
    type: 'button',
    id: 'try-btn',
    className: 'primary try-btn',
    disabled: !done && !state.selectedRule,
    onClick: () => {
      if (done) { go('ch4hub'); return; }
      if (state.selectedRule) applyGuided(state.selectedRule, proof);
    },
  }, [
    el('span', { text: done ? 'Continuer' : 'Essayer' }),
    el('span', { className: 'try-arrow', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
  ]);

  const hintBtn = el('button', {
    type: 'button',
    className: 'hint-btn',
    disabled: done,
    onClick: () => {
      state.hintLevel = Math.min(2, state.hintLevel + 1);
      if (state.hintLevel === 1) {
        const h = proof.hints[Math.min(state.proofStep, proof.hints.length - 1)];
        state.message = `Indice : ${h}`;
      } else {
        const step = proof.solution[state.proofStep];
        state.message = step
          ? `Réponse : utilise « ${RULE_LABELS[step.rule]} ». ${step.note || ''}`
          : 'Tu as déjà toutes les étapes.';
      }
      render();
    },
  }, [state.hintLevel === 0 ? '💡 Indice' : state.hintLevel === 1 ? '💡 Montrer la réponse' : '💡 Aide ouverte']);

  root.append(
    el('section', { className: 'rule-panel' }, [
      el('p', { className: 'panel-title', text: done ? 'Bravo, Camille !' : 'Glisse une règle dans l’arbre' }),
      el('div', { className: 'panel-grid' }, [
        tiles,
        el('div', { className: 'panel-actions' }, [tryBtn, hintBtn]),
      ]),
    ]),
  );

  // Détail des lignes (repliable) : formules complètes et justifications.
  const details = el('details', { className: 'lines-detail' }, [el('summary', { text: 'Voir les lignes de la preuve' })]);
  const ol = el('ol', { className: 'tree-lines', start: '0' });
  state.proofLines.forEach((line, i) => {
    ol.append(el('li', {}, [
      el('span', { className: 'line-idx', text: `(${i})` }),
      el('code', { text: pretty(line.formula) }),
      el('span', { className: 'line-rule', text: line.rule === 'donné' ? line.note || 'donné' : RULE_LABELS[line.rule] || line.rule }),
    ]));
  });
  details.append(ol);
  root.append(details);
}

let lastPointerPick = -1e9;

function selectRule(rule) {
  state.selectedRule = rule;
  state.message = `« ${RULE_LABELS[rule]} » choisie. Touche Essayer.`;
  render();
}

/** Glisser une tuile sur l’arbre = l’essayer. Un simple toucher reste possible. */
function enableDrag(btn, rule, proof) {
  btn.addEventListener('pointerdown', (e) => {
    if (btn.disabled || e.button > 0) return;
    const start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    let ghost = null;
    const zone = document.querySelector('.drop-zone');
    const over = (ev) => {
      const r = zone?.getBoundingClientRect();
      return !!r && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
    };
    const move = (ev) => {
      if (ev.pointerId !== start.id) return;
      if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 10) {
        ghost = btn.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.style.width = `${btn.getBoundingClientRect().width}px`;
        document.body.append(ghost);
      }
      if (ghost) {
        ghost.style.transform = `translate(${ev.clientX - 40}px, ${ev.clientY - 24}px)`;
        zone?.classList.toggle('drop-hover', over(ev));
      }
    };
    const end = (ev) => {
      if (ev.pointerId !== start.id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      lastPointerPick = performance.now();
      if (!ghost) {
        if (ev.type === 'pointerup') selectRule(rule); // simple toucher
        return;
      }
      ghost.remove();
      zone?.classList.remove('drop-hover');
      if (ev.type === 'pointerup' && over(ev)) {
        state.selectedRule = rule;
        applyGuided(rule, proof);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  });
}

/** Mode guidé : la tuile choisie doit correspondre à l’étape solution courante. */
function applyGuided(rule, proof) {
  const r = guidedTry(proof, state.proofLines, state.proofStep, rule);
  if (r.kind === 'reject') state.proofRejects = [...state.proofRejects, r.reject];
  if (r.kind === 'step') {
    state.proofLines = [...state.proofLines, r.line];
    state.proofStep += 1;
    state.hintLevel = 0;
    state.selectedRule = null;
  }
  state.message = r.message;
  render();
}

/* ---------- badges et à propos ---------- */

function renderBadges(root) {
  root.append(
    el('section', { className: 'card' }, [
      el('h2', { text: 'Carnet de badges' }),
      el('p', { className: 'story', text: 'Chaque badge reste ici, sur cet appareil.' }),
    ]),
  );
  const grid = el('div', { className: 'badge-grid' });
  const earned = new Set(state.save.badges);
  for (const [id, info] of Object.entries(BADGE_INFO)) {
    const on = earned.has(id);
    grid.append(
      el('div', { className: `badge${on ? ' on' : ''}` }, [
        el('span', { className: 'emoji', text: info.emoji }),
        el('strong', { text: info.label }),
        el('span', { className: 'meta', text: on ? info.how : 'pas encore' }),
      ]),
    );
  }
  root.append(grid);
  root.append(el('div', { className: 'pager' }, [
    el('button', { type: 'button', className: 'primary big', onClick: goHome }, ['Retour']),
  ]));
}

function renderAbout(root) {
  root.append(
    el('section', { className: 'card' }, [
      el('h2', { text: 'À propos' }),
      el('p', {
        className: 'story',
        text: `Jeu éducatif écrit pour Camille. Aucun code n’a été copié depuis dmoews/logic-theorist ni jeffshrager/IPL-V (dépôts sans licence claire) : moteur, textes et illustrations sont originaux, inspirés des idées historiques.`,
      }),
      el('p', {
        className: 'story',
        text: `Version ${APP_VERSION}. Sauvegarde locale automatique. Aide sans pénalité.`,
      }),
      el('p', {
        className: 'meta',
        text: 'Faits vérifiés : 38/52 théorèmes ; *2.85 plus élégant ; Dartmouth 1956 ; *54·43 vers p.360–362 selon l’édition.',
      }),
    ]),
  );
  root.append(el('div', { className: 'pager' }, [
    el('button', { type: 'button', className: 'primary big', onClick: goHome }, ['Retour']),
  ]));
}

/* ---------- rendu ---------- */

function render() {
  const app = $('#app');
  app.innerHTML = '';
  redrawTree = null;
  app.dataset.screen = state.screen;
  renderHeader(app);
  const main = el('main', { id: 'main' });
  if (state.screen === 'home') renderHome(main);
  else if (state.screen === 'chapter') renderChapter(main);
  else if (state.screen === 'ch4hub') renderCh4Hub(main);
  else if (state.screen === 'proof') renderProof(main);
  else if (state.screen === 'badges') renderBadges(main);
  else if (state.screen === 'about') renderAbout(main);
  app.append(main);
  window.scrollTo(0, 0);
  if (redrawTree) requestAnimationFrame(() => redrawTree && redrawTree());
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`).catch(() => {});
}

function boot() {
  const { save } = loadSave();
  state.save = save;
  const land = el('div', { className: 'landscape', 'aria-hidden': 'true', html: landscapeSVG() });
  document.body.prepend(land);
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => redrawTree && redrawTree(), 80);
  });
  document.fonts?.ready?.then(() => redrawTree && redrawTree());
  render();
  registerSW();
}

boot();
