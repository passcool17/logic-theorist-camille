/**
 * Logic Theorist Camille — bootstrap UI
 * Ambiance sauge/crème, mobile d’abord, français québécois.
 */

import { CHAPTERS, BADGE_INFO } from './chapters.js';
import { CH1, CH2, CH3, CH5 } from './chapters/content.js';
import { PROOFS, pretty } from './logic/proofs.js';
import { tryRule, RULE_LABELS } from './logic/engine.js';
import { eq } from './logic/formula.js';
import {
  loadSave,
  writeSave,
  markChapterDone,
  markProofDone,
  progressSummary,
} from './save.js';
import { applyQuizChoice, quizCanAdvance } from './quiz.js';

const APP_VERSION = 'lt-camille-v7';

let state = {
  save: null,
  screen: 'home', // home | chapter | proof | badges | about
  chapterId: null,
  pageIndex: 0,
  quizAnswered: null,
  quizWrong: null,
  tilesTried: new Set(),
  proofId: null,
  proofLines: [],
  proofStep: 0, // next solution step index for guided mode
  hintLevel: 0, // 0 none, 1 hint, 2 show
  message: '',
};

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

function goHome() {
  state.screen = 'home';
  state.message = '';
  render();
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
  state.proofLines = proof.initials.map((f, i) => ({
    formula: f,
    rule: 'donné',
    note: proof.initialNotes[i] || '',
  }));
  state.proofStep = 0;
  state.hintLevel = 0;
  state.message = 'Touche une tuile pour appliquer la prochaine étape (la machine s’occupe des lignes).';
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

function renderHeader(root) {
  const sum = progressSummary(state.save);
  root.append(
    el('header', { className: 'topbar' }, [
      el('button', { className: 'linkish', type: 'button', onClick: goHome, 'aria-label': 'Accueil' }, [
        el('span', { className: 'logo', text: 'LT' }),
        el('span', { className: 'brand', text: 'Logic Theorist' }),
      ]),
      el('div', { className: 'top-actions' }, [
        el('button', { type: 'button', className: 'ghost', onClick: () => { state.screen = 'badges'; render(); } }, [
          `🏅 ${sum.badges}`,
        ]),
        el('button', { type: 'button', className: 'ghost', onClick: () => { state.screen = 'about'; render(); } }, ['?']),
      ]),
    ]),
  );
}

function renderHome(root) {
  const sum = progressSummary(state.save);
  root.append(
    el('section', { className: 'hero card' }, [
      el('p', { className: 'eyebrow', text: 'Pour Camille · 13 ans' }),
      el('h1', { text: 'Une machine qui raisonne' }),
      el('p', {
        className: 'lede',
        text: 'Découvre Logic Theorist (1955–56) : le programme de Newell, Simon et Shaw qui a prouvé des théorèmes tout seul. Cinq petits chapitres, calmes et progressifs.',
      }),
      el('p', { className: 'meta', text: `${sum.chaptersDone}/5 chapitres · ${sum.proofsDone}/6 preuves` }),
    ]),
  );

  const list = el('div', { className: 'chapter-list' });
  for (const ch of CHAPTERS) {
    const done = !!state.save.completed[ch.id];
    const locked = ch.num > 1 && !state.save.completed[`ch${ch.num - 1}`] && !done;
    list.append(
      el('button', {
        type: 'button',
        className: `chapter-card card${done ? ' done' : ''}${locked ? ' locked' : ''}`,
        disabled: locked,
        onClick: () => {
          if (ch.id === 'ch4') {
            state.screen = 'ch4hub';
            render();
          } else openChapter(ch.id);
        },
      }, [
        el('span', { className: 'num', text: String(ch.num) }),
        el('div', {}, [
          el('strong', { text: ch.title }),
          el('span', { className: 'meta', text: `${ch.duration}${done ? ' · terminé' : ''}` }),
        ]),
      ]),
    );
  }
  root.append(list);
}

function renderChapter(root) {
  const ch = CHAPTERS.find((c) => c.id === state.chapterId);
  const content = contentFor(state.chapterId);
  if (!ch || !content) return;

  const page = content.pages[state.pageIndex];
  const total = content.pages.length;

  root.append(
    el('section', { className: 'card chapter-view' }, [
      el('p', { className: 'eyebrow', text: `Chapitre ${ch.num} · ${state.pageIndex + 1}/${total}` }),
      el('h2', { text: page.title }),
    ]),
  );

  const body = el('section', { className: 'card' });

  if (page.kind === 'story') {
    for (const para of page.body.split('\n\n')) {
      body.append(el('p', { className: 'story', text: para }));
    }
  }

  if (page.kind === 'quiz') {
    body.append(el('p', { className: 'story', text: page.question }));
    const choices = el('div', { className: 'choices' });
    const locked = state.quizAnswered != null;
    for (const c of page.choices) {
      const selected = state.quizAnswered === c.id;
      const wrongMark = !locked && state.quizWrong === c.id;
      choices.append(
        el('button', {
          type: 'button',
          className: `choice${selected ? ' selected' : ''}${locked && c.ok ? ' correct' : ''}${wrongMark ? ' wrong' : ''}`,
          disabled: locked,
          onClick: () => {
            const r = applyQuizChoice({ choice: c, explain: page.explain });
            state.quizAnswered = r.quizAnswered;
            state.quizWrong = r.quizWrong;
            state.message = r.message;
            render();
          },
        }, [c.text]),
      );
    }
    body.append(choices);
    if (state.message) body.append(el('p', { className: 'feedback', role: 'status', text: state.message }));
  }

  if (page.kind === 'tiles') {
    body.append(el('p', { className: 'story', text: page.body }));
    const row = el('div', { className: 'tile-row' });
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
        }, [t.label]),
      );
    }
    body.append(row);
    if (state.message) body.append(el('p', { className: 'feedback', role: 'status', text: state.message }));
    if (state.tilesTried.size >= page.tiles.length) {
      body.append(el('p', { className: 'ok', text: 'Les trois outils sont débloqués. Tu peux continuer.' }));
    }
  }

  root.append(body);

  const nav = el('div', { className: 'pager' });
  nav.append(
    el('button', {
      type: 'button',
      className: 'ghost',
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
    if (page.kind === 'quiz') {
      return quizCanAdvance(state.quizAnswered, page.choices);
    }
    if (page.kind === 'tiles') return state.tilesTried.size >= page.tiles.length;
    return true;
  })();

  const last = state.pageIndex >= total - 1;
  nav.append(
    el('button', {
      type: 'button',
      className: 'primary',
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
        state.message = `Badge « ${ch.badge} » ajouté au carnet.`;
        if (ch.id === 'ch3') {
          state.screen = 'ch4hub';
        } else {
          state.screen = 'home';
        }
        render();
      },
    }, [last ? 'Terminer ✓' : 'Continuer']),
  );
  root.append(nav);
}

function renderCh4Hub(root) {
  root.append(
    el('section', { className: 'card' }, [
      el('p', { className: 'eyebrow', text: 'Chapitre 4' }),
      el('h2', { text: 'Prouve comme LT' }),
      el('p', {
        className: 'story',
        text: 'Voici JOHNNIAC, prêt à chercher. Six petites preuves du chapitre 2 des Principia, de plus en plus costaudes. Tu choisis les règles ; la machine montre l’arbre.',
      }),
    ]),
  );

  // Robot decoration
  root.append(
    el('div', { className: 'robot-banner card', 'aria-hidden': 'true' }, [
      el('div', { className: 'robot' }, [
        el('div', { className: 'robot-head' }, [
          el('span', { className: 'eye' }),
          el('span', { className: 'eye' }),
        ]),
        el('div', { className: 'robot-body', text: 'JOHNNIAC' }),
      ]),
      el('p', { text: '« Prête quand tu l’es, Camille. »' }),
    ]),
  );

  const list = el('div', { className: 'chapter-list' });
  PROOFS.forEach((p, idx) => {
    const done = !!state.save.proofs[p.id];
    const prevOk = idx === 0 || !!state.save.proofs[PROOFS[idx - 1].id];
    list.append(
      el('button', {
        type: 'button',
        className: `chapter-card card${done ? ' done' : ''}${!prevOk ? ' locked' : ''}`,
        disabled: !prevOk,
        onClick: () => openProof(p.id),
      }, [
        el('span', { className: 'num', text: p.code }),
        el('div', {}, [
          el('strong', { text: p.title }),
          el('span', { className: 'meta', text: done ? 'prouvée ✓' : p.blurb.slice(0, 60) + '…' }),
        ]),
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
        className: 'primary',
        disabled: !allDone,
        onClick: () => {
          completeChapter('ch4');
          openChapter('ch5');
        },
      }, [allDone ? 'Chapitre 5 →' : 'Termine les 6 preuves']),
    ]),
  );
}

function renderProof(root) {
  const proof = PROOFS.find((p) => p.id === state.proofId);
  if (!proof) return;

  root.append(
    el('section', { className: 'card proof-head' }, [
      el('p', { className: 'eyebrow', text: `Preuve ${proof.code}` }),
      el('h2', { text: proof.goalDisplay || pretty(proof.goal) }),
      el('p', { className: 'story', text: proof.blurb }),
    ]),
  );

  // Search tree
  const tree = el('section', { className: 'card tree', 'aria-label': 'Arbre de recherche' });
  tree.append(el('p', { className: 'eyebrow', text: 'Arbre de recherche' }));
  const ul = el('ol', { className: 'tree-lines' });
  state.proofLines.forEach((line, i) => {
    ul.append(
      el('li', { className: eq(line.formula, proof.goal) ? 'goal-hit' : '' }, [
        el('span', { className: 'line-idx', text: `(${i})` }),
        el('code', { text: pretty(line.formula) }),
        el('span', { className: 'line-rule', text: line.rule === 'donné' ? line.note || 'donné' : RULE_LABELS[line.rule] || line.rule }),
      ]),
    );
  });
  tree.append(ul);
  root.append(tree);

  // Rule tiles
  const tiles = el('div', { className: 'tile-row sticky-tiles' });
  for (const rule of ['substitution', 'detachment', 'chain']) {
    tiles.append(
      el('button', {
        type: 'button',
        className: 'rule-tile',
        onClick: () => applyGuided(rule, proof),
      }, [RULE_LABELS[rule]]),
    );
  }
  root.append(tiles);

  if (state.message) {
    root.append(el('p', { className: 'feedback card', role: 'status', text: state.message }));
  }

  // Help
  const help = el('div', { className: 'helpbar' });
  help.append(
    el('button', {
      type: 'button',
      className: 'ghost',
      onClick: () => {
        state.hintLevel = Math.min(2, state.hintLevel + 1);
        if (state.hintLevel === 1) {
          const h = proof.hints[Math.min(state.proofStep, proof.hints.length - 1)];
          state.message = `Indice : ${h}`;
        } else {
          const step = proof.solution[state.proofStep];
          if (step) {
            state.message = `Réponse : utilise « ${RULE_LABELS[step.rule]} ». ${step.note || ''}`;
          } else {
            state.message = 'Tu as déjà toutes les étapes.';
          }
        }
        render();
      },
    }, [state.hintLevel === 0 ? 'Indice' : state.hintLevel === 1 ? 'Montrer la réponse' : 'Aide déjà ouverte']),
  );
  help.append(
    el('button', {
      type: 'button',
      className: 'ghost',
      onClick: () => {
        state.screen = 'ch4hub';
        render();
      },
    }, ['Retour']),
  );
  root.append(help);

  const done = state.proofLines.some((l) => eq(l.formula, proof.goal));
  if (done) {
    if (!state.save.proofs[proof.id]) {
      state.save = markProofDone(state.save, proof.id);
      if (PROOFS.every((p) => state.save.proofs[p.id])) {
        state.save = markChapterDone(state.save, 'ch4');
      }
      persist();
    }
    root.append(
      el('div', { className: 'card ok-banner' }, [
        el('strong', { text: 'Preuve trouvée !' }),
        el('p', { text: 'L’arbre a atteint le but. JOHNNIAC est fier.' }),
        el('button', {
          type: 'button',
          className: 'primary',
          onClick: () => {
            state.screen = 'ch4hub';
            render();
          },
        }, ['Continuer']),
      ]),
    );
  }
}

/** Mode guidé : la tuile choisie doit correspondre à l'étape solution courante. */
function applyGuided(rule, proof) {
  if (state.proofLines.some((l) => eq(l.formula, proof.goal))) {
    state.message = 'But déjà atteint.';
    render();
    return;
  }
  const step = proof.solution[state.proofStep];
  if (!step) {
    state.message = 'Plus d’étape prévue.';
    render();
    return;
  }
  if (step.rule !== rule) {
    state.message = `Essaie plutôt « ${RULE_LABELS[step.rule]} » pour cette étape.`;
    render();
    return;
  }
  const premises = step.from.map((i) => state.proofLines[i].formula);
  const outcome = tryRule(rule, premises, step.subst || {});
  if (!outcome.ok) {
    state.message = outcome.error;
    render();
    return;
  }
  state.proofLines.push({
    formula: outcome.result,
    rule,
    note: step.note || '',
  });
  state.proofStep += 1;
  state.hintLevel = 0;
  state.message = step.note || `Bien joué : ${RULE_LABELS[rule]}.`;
  render();
}

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
    el('button', { type: 'button', className: 'primary', onClick: goHome }, ['Retour']),
  ]));
}

function renderAbout(root) {
  root.append(
    el('section', { className: 'card' }, [
      el('h2', { text: 'À propos' }),
      el('p', {
        className: 'story',
        text: `Jeu éducatif écrit pour Camille. Aucun code n’a été copié depuis dmoews/logic-theorist ni jeffshrager/IPL-V (dépôts sans licence claire) : moteur et textes sont originaux, inspirés des idées historiques.`,
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
    el('button', { type: 'button', className: 'primary', onClick: goHome }, ['Retour']),
  ]));
}

function render() {
  const app = $('#app');
  app.innerHTML = '';
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
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`).catch(() => {});
}

function boot() {
  const { save } = loadSave();
  state.save = save;
  render();
  registerSW();
}

boot();
