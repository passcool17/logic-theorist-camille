/**
 * Logic Theorist Camille — interface 2D illustrée (maquette sauge/crème).
 * Mobile d’abord, français québécois. La logique du jeu est inchangée :
 * moteur dans js/logic, mode guidé dans js/proofplay.js.
 */

import { CHAPTERS, BADGE_INFO } from './chapters.js';
import { CH1, CH2, CH3, CH5 } from './chapters/content.js';
import { PROOFS, BONUS_PROOFS, findProof, pretty, proofCardTitle, proofHeading } from './logic/proofs.js';
import { RULE_LABELS, tryRule } from './logic/engine.js';
import { parse } from './logic/formula.js';
import {
  loadSave,
  writeSave,
  markChapterDone,
  markProofDone,
  markFreeSolve,
  progressSummary,
  normalizeSettings,
} from './save.js';
import { applyQuizChoice, quizCanAdvance } from './quiz.js';
import {
  initialLines,
  guidedTry,
  goalReached,
  buildTree,
  ch4StepProgress,
  freeTry,
  substChoices,
  SUBST_PALETTE,
  FREE_MAX_LINES,
} from './proofplay.js';
import {
  johnniacHeadSVG,
  johnniacPortrait,
  ruleIcon,
  chapterArt,
  CHAPTER_ICONS,
  sprigSVG,
  ribbonSVG,
  landscapeSVG,
} from './ui/art.js';
import { renderTree } from './ui/treeview.js';
import { installAudioLifecycle, configureAudio, sfx, audioState } from './audio.js';
import * as motion from './ui/motion.js';

const APP_VERSION = 'lt-camille-v10';
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
  // Mode libre (v9) : lignes touchées (dans l’ordre) et remplacements choisis.
  freePicks: [],
  freeSubst: {},
  freeSolved: false,
  // Effet unique à jouer après le prochain rendu : { kind, key }.
  fx: null,
};

let redrawTree = null;
const lastPct = new Map();

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

function go(screen, dir = 'forward') {
  state.screen = screen;
  state.message = '';
  render({ dir });
}
function goHome() {
  go('home', 'back');
}

/** Carte d’entrée de chapitre par-dessus le nouvel écran (déjà rendu dessous). */
function chapterCurtain(id) {
  const ch = CHAPTERS.find((c) => c.id === id);
  if (!ch) return;
  sfx('page');
  motion.chapterIntro({ num: ch.num, title: ch.title, artHTML: chapterArt(id, { lazy: false }) });
}

function settings() {
  return state.save.settings;
}

function updateSettings(patch) {
  state.save = { ...state.save, settings: normalizeSettings({ ...state.save.settings, ...patch }) };
  persist();
  applySettings();
}

function applySettings() {
  const s = settings();
  configureAudio({ muted: s.muted, music: s.music, sfx: s.sfx });
  motion.setUserReduce(s.reduceMotion);
}

function openChapter(id, { intro = true } = {}) {
  state.screen = 'chapter';
  state.chapterId = id;
  state.pageIndex = 0;
  state.quizAnswered = null;
  state.quizWrong = null;
  state.tilesTried = new Set();
  state.hintLevel = 0;
  state.message = '';
  render({ dir: 'forward' });
  if (intro) chapterCurtain(id);
}

const GUIDED_START = 'Choisis une règle, puis touche Essayer. La machine s’occupe des lignes.';
const FREE_START = 'Mode libre : touche une règle, puis la ou les lignes à utiliser. À toi de jouer !';

function resetProof(proof) {
  state.proofLines = initialLines(proof);
  state.proofStep = 0;
  state.proofRejects = [];
  state.selectedRule = null;
  state.hintLevel = 0;
  state.freePicks = [];
  state.freeSubst = {};
  state.freeSolved = false;
  state.message = settings().proofMode === 'free' ? FREE_START : GUIDED_START;
}

function openProof(id) {
  const proof = findProof(id);
  if (!proof) return;
  state.screen = 'proof';
  state.proofId = id;
  resetProof(proof);
  render({ dir: 'forward' });
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
  const prev = lastPct.get(label);
  lastPct.set(label, pct);
  if (prev != null && prev < pct && pct > 0) {
    state.pendingGrow = { label, from: prev / pct };
  }
  return el('div', { className: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(done), 'aria-label': label }, [
    el('span', { className: 'progress-sprig', html: sprigSVG() }),
    el('span', { className: 'progress-track' }, [el('span', { className: 'progress-fill', 'data-label': label, style: `width:${pct}%` })]),
    el('span', { className: 'progress-count', text: `${done} / ${total}` }),
  ]);
}

function backTarget() {
  if (state.screen === 'proof') return () => go('ch4hub', 'back');
  return goHome;
}

function headerTitle() {
  if (state.screen === 'chapter') {
    const ch = CHAPTERS.find((c) => c.id === state.chapterId);
    return ch ? `Ch. ${ch.num} · ${ch.title}` : '';
  }
  if (state.screen === 'ch4hub' || state.screen === 'proof') return 'Ch. 4 · Prouve comme LT';
  if (state.screen === 'badges') return 'Carnet de badges';
  if (state.screen === 'about') return 'Réglages et à propos';
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
        ? el('button', { type: 'button', className: 'about-btn', 'aria-label': 'Réglages et à propos', title: 'Réglages et à propos', onClick: () => go('about'), html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.4A7.5 7.5 0 0 0 7 6.4l-2.4-.9-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 0 0 2.6 1.5l.4 2.4h4l.4-2.4a7.5 7.5 0 0 0 2.6-1.5l2.4.9 2-3.4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' })
        : null,
      soundButton(),
      el('button', {
        type: 'button',
        className: 'ribbon',
        'aria-label': `Carnet de badges : ${sum.badges}`,
        onClick: () => go('badges'),
      }, [el('span', { html: ribbonSVG() }), el('span', { className: 'ribbon-n', text: String(sum.badges) })]),
    ]),
  );
}

const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function soundButton() {
  const muted = settings().muted;
  return el('button', {
    type: 'button',
    className: `sound-btn${muted ? ' muted' : ''}`,
    'aria-pressed': muted ? 'true' : 'false',
    'aria-label': muted ? 'Son coupé : toucher pour remettre le son' : 'Son activé : toucher pour couper le son',
    title: 'Son (touche M)',
    html: muted ? ICON_SOUND_OFF : ICON_SOUND_ON,
    onClick: toggleMute,
  });
}

function toggleMute() {
  updateSettings({ muted: !settings().muted });
  const btn = document.querySelector('.sound-btn');
  if (btn) btn.replaceWith(soundButton());
  if (!settings().muted) sfx('select');
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
      el('div', { className: 'hero-art robot-idle', html: johnniacPortrait({ hero: true }) }),
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
          if (ch.id === 'ch4') {
            go('ch4hub');
            chapterCurtain('ch4');
          } else openChapter(ch.id);
        },
      }, [
        el('span', { className: 'chap-icon', html: CHAPTER_ICONS[ch.id] || '' }),
        el('span', { className: 'chap-text' }, [
          el('span', { className: 'chap-num', text: `Chapitre ${ch.num}` }),
          el('strong', { text: ch.title }),
          el('span', { className: 'meta', text: `${ch.duration}${ch.id === 'ch4' ? ` · ${sum.coreDone}/6 preuves${sum.bonusDone ? ` · bonus ${sum.bonusDone}/6` : ''}` : ''}` }),
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
    state.pageIndex === 0 ? el('div', { className: 'chapter-banner', html: chapterArt(ch.id) }) : null,
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
            sfx(c.ok ? 'success' : 'fail');
            state.fx = { kind: c.ok ? 'quiz-ok' : 'quiz-no' };
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
          'data-tile': t.id,
          onClick: () => {
            const fresh = !state.tilesTried.has(t.id);
            state.tilesTried.add(t.id);
            state.message = t.demo;
            sfx(fresh ? 'step' : 'select');
            state.fx = { kind: 'tile', key: t.id };
            render();
          },
        }, [
          el('span', { className: 'rule-icon', html: ruleIcon(t.id) }),
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
        sfx('page');
        render({ dir: 'back' });
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
          sfx('page');
          render({ dir: 'forward' });
          return;
        }
        completeChapter(ch.id);
        const msg = `Badge « ${ch.badge} » ajouté au carnet.`;
        state.screen = ch.id === 'ch3' ? 'ch4hub' : 'home';
        state.message = msg;
        sfx('success');
        state.fx = { kind: 'speech' };
        render({ dir: ch.id === 'ch3' ? 'forward' : 'back' });
        if (ch.id === 'ch3') chapterCurtain('ch4');
      },
    }, [last ? 'Terminer ✓' : 'Continuer', el('span', { className: 'btn-arrow', text: '→', 'aria-hidden': 'true' })]),
  );
  root.append(nav);
}

/* ---------- chapitre 4 : choix des preuves ---------- */

function proofCard(p, idx, list) {
  const done = !!state.save.proofs[p.id];
  const prevOk = idx === 0 || !!state.save.proofs[list[idx - 1].id];
  return el('button', {
    type: 'button',
    className: `chapter-card proof-card${done ? ' done' : ''}${!prevOk ? ' locked' : ''}`,
    disabled: !prevOk,
    onClick: () => openProof(p.id),
  }, [
    el('span', { className: 'code-pill', text: p.code }),
    el('span', { className: 'chap-text' }, [
      el('strong', { className: 'math', text: proofCardTitle(p) }),
      el('span', { className: 'meta', text: done ? 'prouvée ✓' : p.blurb.length > 64 ? p.blurb.slice(0, 62) + '…' : p.blurb }),
    ]),
    el('span', { className: `chap-status${done ? ' ok' : ''}`, text: done ? '✓' : !prevOk ? '🔒' : '→', 'aria-label': done ? 'prouvée' : !prevOk ? 'verrouillée' : 'ouvrir' }),
  ]);
}

function renderCh4Hub(root) {
  const prog = ch4StepProgress(PROOFS, state.save.proofs, null);
  root.append(progressBar(prog.done, prog.total, 'Étapes de preuve du chapitre 4'));
  root.append(
    el('section', { className: 'card hub-hero' }, [
      el('div', { className: 'hub-art robot-idle', html: johnniacPortrait({ mood: 'smile' }) }),
      el('div', {}, [
        el('h2', { text: 'Prouve comme LT' }),
        el('p', {
          className: 'story',
          text: 'Cinq petites preuves des Principia, puis un défi inspiré de *2.85, de plus en plus costauds. Mode guidé : tu choisis la règle. Mode libre : tu choisis aussi les lignes !',
        }),
      ]),
    ]),
  );
  if (state.message) root.append(speech(state.message));

  root.append(el('h3', { className: 'list-title', text: 'Les 6 preuves de LT' }));
  const list = el('div', { className: 'chapter-list' });
  PROOFS.forEach((p, idx) => list.append(proofCard(p, idx, PROOFS)));
  root.append(list);

  const sum = progressSummary(state.save);
  root.append(el('div', { className: 'list-title bonus-title' }, [
    el('h3', { text: 'Atelier libre · 6 nouveaux théorèmes' }),
    el('span', { className: 'meta', text: `Bonus des Principia (*2), pas obligatoire · ${sum.bonusDone}/6 prouvés` }),
  ]));
  const bonus = el('div', { className: 'chapter-list' });
  BONUS_PROOFS.forEach((p, idx) => bonus.append(proofCard(p, idx, BONUS_PROOFS)));
  root.append(bonus);

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

function isBonus(proof) {
  return BONUS_PROOFS.includes(proof);
}

function recordSolved(proof, { free }) {
  if (!state.save.proofs[proof.id]) {
    state.save = markProofDone(state.save, proof.id);
    if (PROOFS.every((p) => state.save.proofs[p.id])) {
      state.save = markChapterDone(state.save, 'ch4');
    }
  }
  if (free) state.save = markFreeSolve(state.save);
  persist();
}

function modeSwitch(proof) {
  const mode = settings().proofMode;
  const opt = (value, label, sub) => el('button', {
    type: 'button',
    role: 'radio',
    'aria-checked': mode === value ? 'true' : 'false',
    className: `mode-opt${mode === value ? ' on' : ''}`,
    'data-focus': `mode-${value}`,
    onClick: () => {
      if (settings().proofMode === value) return;
      updateSettings({ proofMode: value });
      resetProof(proof);
      sfx('select');
      state.fx = { kind: 'speech' };
      render();
    },
  }, [el('strong', { text: label }), el('span', { text: sub })]);
  return el('div', { className: 'mode-switch', role: 'radiogroup', 'aria-label': 'Mode de preuve' }, [
    opt('guided', 'Guidé', 'la machine choisit les lignes'),
    opt('free', 'Libre', 'tu choisis les lignes'),
  ]);
}

function renderProof(root) {
  const proof = findProof(state.proofId);
  if (!proof) return;
  const free = settings().proofMode === 'free';
  const done = goalReached(proof, state.proofLines);

  if (isBonus(proof)) {
    const n = BONUS_PROOFS.filter((p) => state.save.proofs[p.id]).length;
    root.append(progressBar(n, BONUS_PROOFS.length, 'Nouveaux théorèmes prouvés'));
  } else {
    const prog = ch4StepProgress(PROOFS, state.save.proofs, free ? null : { id: proof.id, step: state.proofStep });
    root.append(progressBar(prog.done, prog.total, 'Étapes de preuve du chapitre 4'));
  }
  root.append(modeSwitch(proof));

  // Scène : JOHNNIAC à gauche, arbre à droite.
  const model = buildTree(proof, state.proofLines, state.proofRejects, 2);
  const goalText = (proof.goalDisplay || pretty(proof.goal)).replace(/\s*\[.*\]\s*$/, '');
  model.goal = goalText;
  const tv = renderTree(model, { heading: proofHeading(proof) });
  redrawTree = tv.draw;
  const nInit = proof.initials.length;
  const stepNow = state.proofLines.length - nInit;
  const lastReject = state.proofRejects[state.proofRejects.length - 1];
  const puzzled = !done && lastReject && lastReject.at === (free ? stepNow : state.proofStep);
  const mood = done ? 'proud' : puzzled ? 'oops' : state.hintLevel > 0 ? 'think' : 'smile';
  const offset = -((performance.now() % 4200) / 1000).toFixed(2);
  root.append(
    el('section', { className: 'scene' }, [
      el('div', { className: `scene-robot mood-${mood}` }, [
        el('div', { className: 'robot-react' }, [
          el('div', { className: 'robot-idle', style: `animation-delay:${offset}s`, html: johnniacPortrait({ mood }) }),
        ]),
      ]),
      el('div', { className: 'scene-tree drop-zone' }, [tv.el]),
    ]),
  );

  if (done) {
    root.append(speech(state.freeSolved
      ? 'Preuve trouvée toute seule ! Tu as choisi chaque ligne, comme LT. JOHNNIAC est fier.'
      : 'Preuve trouvée ! L’arbre a atteint le but. JOHNNIAC est fier.'));
    if (proof.kid) root.append(kidCard(proof));
  } else {
    root.append(speech(state.message));
  }

  if (free) renderFreePanel(root, proof, done);
  else renderGuidedPanel(root, proof, done);
}

function kidCard(proof) {
  return el('section', { className: 'card kid-card' }, [
    el('p', { className: 'eyebrow', text: `${proof.inspiredBy ? proofHeading(proof) : proof.code} en mots simples` }),
    el('p', { className: 'story', text: proof.kid }),
    proof.source ? el('p', { className: 'meta', text: `Source : ${proof.source}.` }) : null,
  ]);
}

function hintButton(proof, done, free) {
  return el('button', {
    type: 'button',
    className: 'hint-btn',
    disabled: done,
    'data-focus': 'hint',
    onClick: () => {
      state.hintLevel = Math.min(2, state.hintLevel + 1);
      const k = free ? state.proofLines.length - proof.initials.length : state.proofStep;
      if (state.hintLevel === 1) {
        const h = proof.hints[Math.min(k, proof.hints.length - 1)];
        state.message = `Indice : ${h}`;
      } else if (free) {
        state.message = `Recette complète (depuis le début) : ${solutionRecipe(proof)}`;
      } else {
        const step = proof.solution[state.proofStep];
        state.message = step
          ? `Réponse : utilise « ${RULE_LABELS[step.rule]} ». ${step.note || ''}`
          : 'Tu as déjà toutes les étapes.';
      }
      state.fx = { kind: 'speech' };
      render();
    },
  }, [state.hintLevel === 0 ? '💡 Indice' : state.hintLevel === 1 ? (free ? '💡 Toute la recette' : '💡 Montrer la réponse') : '💡 Aide ouverte']);
}

/** « 1) Substitution sur (0) : q→p · 2) Raccourci (2) + (0) » */
function solutionRecipe(proof) {
  return proof.solution.map((st, i) => {
    const lines = st.from.map((j) => `(${j})`).join(' + ');
    const subs = Object.entries(st.subst || {})
      .filter(([k, f]) => pretty(f) !== k)
      .map(([k, f]) => `${k}→${pretty(f)}`)
      .join(', ');
    return `${i + 1}) ${RULE_LABELS[st.rule]} ${lines}${subs ? ` avec ${subs}` : ''}`;
  }).join(' · ');
}

function ruleTiles(proof, done, { drag }) {
  const tiles = el('div', { className: 'tile-col' });
  for (const rule of RULES) {
    const btn = el('button', {
      type: 'button',
      className: `rule-tile${state.selectedRule === rule ? ' selected' : ''}`,
      'aria-pressed': state.selectedRule === rule ? 'true' : 'false',
      disabled: done,
      'data-rule': rule,
      'data-focus': `rule-${rule}`,
      // Clavier / lecteur d’écran ; au doigt ou à la souris, la sélection se fait au pointerup.
      onClick: () => {
        if (drag && performance.now() - lastPointerPick < 600) return;
        selectRule(rule);
      },
    }, [
      el('span', { className: 'rule-icon', html: ruleIcon(rule) }),
      el('span', { className: 'rule-name', text: RULE_LABELS[rule] }),
    ]);
    if (drag) enableDrag(btn, rule, proof);
    tiles.append(btn);
  }
  return tiles;
}

function renderGuidedPanel(root, proof, done) {
  const tiles = ruleTiles(proof, done, { drag: true });
  const tryBtn = el('button', {
    type: 'button',
    id: 'try-btn',
    className: 'primary try-btn panel-apply',
    disabled: !done && !state.selectedRule,
    onClick: () => {
      if (done) { go('ch4hub', 'back'); return; }
      if (state.selectedRule) applyGuided(state.selectedRule, proof);
    },
  }, [
    el('span', { text: done ? 'Continuer' : 'Essayer' }),
    el('span', { className: 'try-arrow', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M5 12h13m-5-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
  ]);

  root.append(
    el('section', { className: 'rule-panel' }, [
      el('p', { className: 'panel-title', text: done ? 'Bravo, Camille !' : 'Glisse une règle dans l’arbre' }),
      el('div', { className: 'panel-grid' }, [
        tiles,
        el('div', { className: 'panel-actions' }, [tryBtn, hintButton(proof, done, false)]),
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
      el('span', { className: 'line-rule', text: lineWhy(line) }),
    ]));
  });
  details.append(ol);
  root.append(details);
}

function lineWhy(line) {
  if (line.rule === 'donné') return line.note || 'donné';
  const from = (line.from || []).map((j) => `(${j})`).join(' + ');
  return `${RULE_LABELS[line.rule] || line.rule}${from ? ` de ${from}` : ''}`;
}

/* ---------- mode libre ---------- */

function freeNeed() {
  return state.selectedRule === 'substitution' ? 1 : 2;
}

function freePreview(proof) {
  if (state.selectedRule !== 'substitution' || state.freePicks.length !== 1) return null;
  const line = state.proofLines[state.freePicks[0]];
  const map = {};
  for (const [k, v] of Object.entries(state.freeSubst)) if (v) map[k] = parse(v);
  const r = tryRule('substitution', [line.formula], map);
  return r.ok ? pretty(r.result) : null;
}

function renderFreePanel(root, proof, done) {
  const nInit = proof.initials.length;
  const derived = state.proofLines.length - nInit;
  const need = freeNeed();
  const ready = !!state.selectedRule && state.freePicks.length === need;

  const panel = el('section', { className: 'rule-panel free-panel' });
  panel.append(el('p', {
    className: 'panel-title',
    text: done ? 'Bravo, Camille !' : !state.selectedRule ? '1. Choisis une règle' : `2. Touche ${need === 1 ? 'une ligne' : 'deux lignes'}`,
  }));
  const tiles = ruleTiles(proof, done, { drag: false });
  tiles.classList.add('tile-row');
  panel.append(tiles);

  // Lignes disponibles (on peut toucher les lignes de départ et celles déjà trouvées).
  const list = el('ol', { className: 'line-list', start: '0', 'aria-label': 'Lignes de la preuve' });
  state.proofLines.forEach((line, i) => {
    const order = state.freePicks.indexOf(i);
    const picked = order >= 0;
    list.append(el('li', {}, [
      el('button', {
        type: 'button',
        className: `line-chip${picked ? ' picked' : ''}${i >= nInit ? ' found' : ''}`,
        'aria-pressed': picked ? 'true' : 'false',
        'data-line': String(i),
        'data-focus': `line-${i}`,
        disabled: done,
        onClick: () => pickLine(i),
      }, [
        el('span', { className: 'line-idx', text: picked && need === 2 ? `${order + 1}` : `(${i})` }),
        el('code', { text: pretty(line.formula) }),
        el('span', { className: 'line-rule', text: lineWhy(line) }),
      ]),
    ]));
  });
  panel.append(list);

  // Choix des remplacements (Substitution).
  if (!done && state.selectedRule === 'substitution' && state.freePicks.length === 1) {
    const f = state.proofLines[state.freePicks[0]].formula;
    const box = el('div', { className: 'subst-box' }, [
      el('p', { className: 'subst-title', text: 'Que devient chaque lettre ? (surligné = elle ne change pas)' }),
    ]);
    for (const letter of substChoices(f)) {
      const row = el('div', { className: 'subst-row', role: 'radiogroup', 'aria-label': `${letter} devient` }, [
        el('span', { className: 'subst-letter', text: `${letter} →` }),
      ]);
      // Par défaut, chaque lettre reste elle-même (case surlignée).
      const current = state.freeSubst[letter] || letter;
      for (const opt of SUBST_PALETTE) {
        const on = current === opt;
        row.append(el('button', {
          type: 'button',
          role: 'radio',
          'aria-checked': on ? 'true' : 'false',
          className: `subst-opt${on ? ' on' : ''}${opt === letter ? ' same' : ''}`,
          'data-focus': `subst-${letter}-${opt}`,
          'aria-label': opt === letter ? `${letter} reste ${letter}` : `${letter} devient ${opt}`,
          onClick: () => {
            state.freeSubst = { ...state.freeSubst, [letter]: opt };
            sfx('select');
            render();
          },
        }, [opt]));
      }
      box.append(row);
    }
    const prev = freePreview(proof);
    if (prev) box.append(el('p', { className: 'subst-preview' }, ['Résultat : ', el('code', { text: prev })]));
    panel.append(box);
  }

  panel.append(el('p', { className: 'free-tip meta', text: 'Rappel : ¬a ∨ b veut dire a ⊃ b.' }));

  const apply = el('button', {
    type: 'button',
    className: 'primary big panel-apply',
    disabled: !done && !ready,
    'data-focus': 'apply',
    onClick: () => {
      if (done) { go('ch4hub', 'back'); return; }
      applyFree(proof);
    },
  }, [done ? 'Continuer →' : 'Appliquer']);
  const undo = el('button', {
    type: 'button',
    className: 'ghost',
    disabled: done || derived === 0,
    'data-focus': 'undo',
    onClick: () => {
      state.proofLines = state.proofLines.slice(0, -1);
      state.proofRejects = state.proofRejects.filter((r) => r.at < state.proofLines.length - nInit);
      state.freePicks = state.freePicks.filter((i) => i < state.proofLines.length);
      state.message = 'Dernière ligne effacée.';
      sfx('page');
      render();
    },
  }, ['Effacer la dernière']);
  panel.append(el('div', { className: 'free-actions' }, [apply, undo, hintButton(proof, done, true)]));
  panel.append(el('p', { className: 'meta free-count', text: `${derived}/${FREE_MAX_LINES} lignes trouvées` }));
  root.append(panel);
}

function pickLine(i) {
  if (!state.selectedRule) {
    state.message = 'Choisis d’abord une règle, puis touche les lignes.';
    sfx('fail');
    state.fx = { kind: 'need' };
    render();
    return;
  }
  const need = freeNeed();
  let picks = state.freePicks.includes(i) ? state.freePicks.filter((j) => j !== i) : [...state.freePicks, i];
  if (picks.length > need) picks = picks.slice(-need);
  state.freePicks = picks;
  state.freeSubst = {};
  sfx('select');
  render();
}

function applyFree(proof) {
  const r = freeTry(proof, state.proofLines, {
    rule: state.selectedRule,
    picks: state.freePicks,
    subst: state.freeSubst,
  });
  state.message = r.message;
  if (r.kind === 'step' || r.kind === 'done') {
    state.proofLines = [...state.proofLines, r.line];
    const idx = state.proofLines.length - 1;
    state.freePicks = [];
    state.freeSubst = {};
    state.selectedRule = null;
    state.hintLevel = 0;
    if (r.kind === 'done') {
      state.freeSolved = true;
      recordSolved(proof, { free: true });
      sfx('success');
    } else {
      sfx('step');
    }
    state.fx = { kind: r.kind, key: `L${idx}`, line: idx };
  } else if (r.kind === 'reject') {
    state.proofRejects = [...state.proofRejects, r.reject];
    sfx('fail');
    state.fx = { kind: 'reject' };
  } else {
    sfx('fail');
    state.fx = { kind: 'need' };
  }
  render();
}

let lastPointerPick = -1e9;

function selectRule(rule) {
  state.selectedRule = rule;
  sfx('select');
  if (settings().proofMode === 'free') {
    state.freePicks = state.freePicks.slice(0, rule === 'substitution' ? 1 : 2);
    state.freeSubst = {};
    state.message = rule === 'substitution'
      ? '« Substitution » : touche UNE ligne, puis choisis ce que devient chaque lettre.'
      : `« ${RULE_LABELS[rule]} » : touche DEUX lignes.`;
  } else {
    state.message = `« ${RULE_LABELS[rule]} » choisie. Touche Essayer.`;
  }
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
  if (r.kind === 'reject') {
    state.proofRejects = [...state.proofRejects, r.reject];
    sfx('fail');
    state.fx = { kind: 'reject' };
  }
  if (r.kind === 'step') {
    state.proofLines = [...state.proofLines, r.line];
    state.proofStep += 1;
    state.hintLevel = 0;
    state.selectedRule = null;
    const idx = state.proofLines.length - 1;
    const solved = goalReached(proof, state.proofLines);
    if (solved) recordSolved(proof, { free: false });
    sfx(solved ? 'success' : 'step');
    state.fx = { kind: solved ? 'done' : 'step', key: `L${idx}`, line: idx };
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

function settingsCard() {
  const s = settings();
  const toggle = (key, label, sub, invert = false) => {
    const on = invert ? !s[key] : !!s[key];
    return el('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': on ? 'true' : 'false',
      className: `switch-row${on ? ' on' : ''}`,
      'data-focus': `set-${key}`,
      onClick: () => {
        updateSettings({ [key]: !s[key] });
        sfx('select');
        render();
      },
    }, [
      el('span', { className: 'switch-text' }, [el('strong', { text: label }), el('span', { className: 'meta', text: sub })]),
      el('span', { className: 'switch', 'aria-hidden': 'true' }, [el('span', { className: 'knob' })]),
    ]);
  };
  const slider = (key, label) => {
    const id = `vol-${key}`;
    const input = el('input', {
      type: 'range',
      id,
      min: '0',
      max: '100',
      step: '5',
      value: String(Math.round(s[key] * 100)),
      disabled: s.muted,
      'data-focus': id,
    });
    input.addEventListener('input', () => {
      configureAudio({ [key]: Number(input.value) / 100 });
    });
    input.addEventListener('change', () => {
      updateSettings({ [key]: Number(input.value) / 100 });
      if (key === 'sfx') sfx('step');
    });
    return el('div', { className: 'slider-row' }, [el('label', { for: id, text: label }), input]);
  };
  return el('section', { className: 'card settings-card' }, [
    el('h2', { text: 'Réglages' }),
    toggle('muted', 'Son', s.muted ? 'coupé' : 'musique douce et petits effets', true),
    slider('music', 'Musique'),
    slider('sfx', 'Effets'),
    toggle('reduceMotion', 'Moins d’animations', 'transitions presque instantanées'),
    el('p', { className: 'meta', text: 'Tes réglages restent sur cet appareil. Raccourci clavier : M coupe le son.' }),
  ]);
}

function renderAbout(root) {
  root.append(settingsCard());
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
        text: 'Illustrations : peintes pour ce jeu par le bot Atelier assets (images générées par IA ; personnages inventés). Musique : boucle générée avec MusicGen (Meta, modèle musicgen-small, licence CC BY-NC 4.0), usage non commercial. Petits sons : synthétisés dans le navigateur. Énoncés des théorèmes *2 vérifiés sur Metamath (set.mm).',
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

function render({ dir = null } = {}) {
  const app = $('#app');
  // Le focus clavier survit au re-rendu (sinon il retombe sur <body>).
  const focusKey = document.activeElement?.dataset?.focus || null;
  const keepY = window.scrollY;
  app.innerHTML = '';
  redrawTree = null;
  state.pendingGrow = null;
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
  if (dir) {
    window.scrollTo(0, 0);
    motion.screenEnter(main, dir);
  } else {
    window.scrollTo(0, keepY);
  }
  if (focusKey) app.querySelector(`[data-focus="${focusKey}"]`)?.focus({ preventScroll: true });
  if (state.pendingGrow) {
    const { label, from } = state.pendingGrow;
    const fill = app.querySelector(`.progress-fill[data-label="${label}"]`);
    motion.growBar(fill, from, 1);
  }
  const fx = state.fx;
  state.fx = null;
  if (redrawTree) {
    requestAnimationFrame(() => {
      if (redrawTree) redrawTree();
      playFx(fx);
    });
  } else {
    playFx(fx);
  }
}

/** Effets d’un coup (après le rendu) : nouveau nœud, essai raté, preuve trouvée… */
function playFx(fx) {
  if (!fx) return;
  const app = $('#app');
  const robot = app.querySelector('.robot-react');
  if (fx.kind === 'step' || fx.kind === 'done') {
    const node = app.querySelector(`[data-key="${fx.key}"]`);
    motion.popIn(node);
    app.querySelectorAll(`.edge[data-to="${fx.key}"]`).forEach((p) => motion.drawPath(p, 80));
    motion.slideIn(app.querySelector(`.line-chip[data-line="${fx.line}"]`), 60);
  }
  if (fx.kind === 'done') {
    motion.react(robot, 'happy');
    motion.sparkle(app.querySelector('.scene-robot'), 14);
    motion.popIn(app.querySelector('.tn-target'), 120);
  }
  if (fx.kind === 'reject') {
    const rejects = app.querySelectorAll('.tn-reject');
    const last = rejects[rejects.length - 1];
    motion.popIn(last);
    motion.react(robot, 'puzzled');
    motion.shake(app.querySelector('.panel-apply'));
  }
  if (fx.kind === 'need') {
    motion.shake(app.querySelector('.panel-apply'));
  }
  if (fx.kind === 'quiz-ok') motion.popIn(app.querySelector('.choice.correct'));
  if (fx.kind === 'quiz-no') motion.shake(app.querySelector('.choice.wrong'));
  if (fx.kind === 'tile') motion.popIn(app.querySelector(`.rule-tile[data-tile="${fx.key}"] .rule-icon`));
  if (fx.kind === 'speech') motion.slideIn(app.querySelector('.speech'));
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`).catch(() => {});
}

function boot() {
  const { save } = loadSave();
  state.save = save;
  applySettings();
  installAudioLifecycle();
  // Petit accès de diagnostic pour les tests (lecture seule).
  globalThis.__ltAudio = audioState;
  // Petit « tic » sur chaque bouton (ignoré si un son plus précis vient de jouer).
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('button');
    if (b && !b.disabled) sfx('tap', { generic: true });
  });
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target instanceof HTMLInputElement)) {
      toggleMute();
    }
  });
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
