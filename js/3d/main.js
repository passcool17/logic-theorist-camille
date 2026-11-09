/**
 * Logic Theorist Camille — monde 3D (accueil).
 * ?zone=z4 pour QA · ?fresh=1 pour reset · lien version simple → /simple/
 */
import * as THREE from 'three';
import { loadSave, writeSave, markChapterDone, markProofDone, progressSummary } from '../save.js';
import { ZONES, isZoneUnlocked, zoneSpawn } from './zones.js';
import { buildWorld, makeLights } from './world.js';
import { makePlayer } from './player.js';
import { makeInput } from './input.js';
import { makePerf, IS_TOUCH } from './perf.js';
import { makeNpcs } from './npcs.js';
import { makePanel } from './panel.js';
import { clearProofTree } from './proof-view.js';

const APP_VERSION = 'lt-camille-v5';
const params = new URLSearchParams(location.search);

if (params.has('fresh')) {
  try { localStorage.removeItem('lt.camille.v1'); } catch (_) {}
}

const { save: initial } = loadSave();
let save = initial;

const canvas = document.getElementById('c');
document.body.classList.toggle('touch', IS_TOUCH);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, IS_TOUCH ? 1.75 : 2));
renderer.shadowMap.enabled = !IS_TOUCH;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const { sun } = makeLights(scene);
const world = buildWorld(scene);
world.refreshLocks(save);
makeNpcs(scene);

const spawn = params.get('zone') && isZoneUnlocked(save, params.get('zone'))
  ? zoneSpawn(params.get('zone'))
  : (save.pos || { x: 0, z: 4 });
// QA: ?zone=z4 force spawn même si locked si ?qa=1
const qaZone = params.get('zone');
const start = (params.get('qa') === '1' && qaZone)
  ? zoneSpawn(qaZone)
  : spawn;
if (params.get('qa') === '1' && qaZone) {
  // débloque jusqu'à la zone demandée pour la vérif
  for (const z of ZONES) {
    if (z.num <= (ZONES.find((x) => x.id === qaZone)?.num || 1)) {
      save.zones[z.id] = true;
      if (z.num > 1) {
        const prev = ZONES.find((x) => x.num === z.num - 1);
        if (prev) save.completed[prev.chapterId] = true;
      }
    }
  }
  world.refreshLocks(save);
}

const player = makePlayer(scene, start);

const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 140);
const camTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();
let camSnap = true;

const prompt = document.getElementById('prompt');
const hudProgress = document.getElementById('hud-progress');
const hudBadges = document.getElementById('hud-badges');

function persist() {
  save.pos = { x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2) };
  const r = writeSave(save);
  save = r.save;
  refreshHud();
}

function refreshHud() {
  const sum = progressSummary(save);
  if (hudProgress) hudProgress.textContent = `${sum.chaptersDone}/5 · ${sum.proofsDone}/6`;
  if (hudBadges) hudBadges.textContent = `🏅 ${sum.badges}`;
}

const panel = makePanel({
  root: document.getElementById('panel'),
  onClose: () => { input.enabled = true; },
  onChapterDone: (chapterId) => {
    save = markChapterDone(save, chapterId);
    world.refreshLocks(save);
    persist();
    toast(`Chapitre terminé — zone suivante débloquée.`);
  },
  onProofDone: (proofId) => {
    save = markProofDone(save, proofId);
    world.refreshLocks(save);
    persist();
    toast('Preuve ajoutée au carnet.');
  },
  getProofTree: () => world.proofTree,
});

function toast(msg) {
  const t = document.getElementById('toasts');
  if (!t) return;
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  t.appendChild(d);
  setTimeout(() => d.remove(), 2800);
}

function nearestInteractable() {
  const p = player.pos;
  let best = null;
  let bestD = 2.4;
  for (const z of ZONES) {
    if (!isZoneUnlocked(save, z.id) && !(params.get('qa') === '1')) continue;
    const d = Math.hypot(p.x - z.x, p.z - z.z);
    if (d < bestD) { bestD = d; best = { kind: 'zone', zone: z }; }
  }
  // NPCs roughly
  for (const [x, z, label] of [
    [6.5, 4.5, 'Newell — « Une machine qui cherche. »'],
    [9.5, 5.2, 'Simon — « Des fiches, puis le JOHNNIAC. »'],
    [-6.5, -4.2, 'Shaw — « IPL : le langage des listes. »'],
  ]) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d < Math.min(bestD, 2.0)) { bestD = d; best = { kind: 'npc', label }; }
  }
  return best;
}

function interact() {
  if (panel.open) return;
  const it = nearestInteractable();
  if (!it) return;
  input.enabled = false;
  if (it.kind === 'npc') {
    panel.showTalk(it.label);
    return;
  }
  const z = it.zone;
  if (z.chapterId === 'ch4') {
    panel.showProofHub(save, (id) => {
      clearProofTree(world.proofTree);
      panel.showProof(id);
    });
  } else {
    panel.showChapter(z.chapterId);
  }
}

const input = makeInput({
  onInteract: interact,
  onKey: (e) => {
    if (e.code === 'Escape' && panel.open) { panel.hide(); input.enabled = true; return true; }
    return false;
  },
});

const perf = makePerf(renderer, sun);

function placeCamera(snap = false) {
  const portrait = camera.aspect < 1;
  const focus = panel.focus;
  if (focus) {
    // Pendant une preuve : cadrer socle + arbre 3D (laisser de la place en bas pour le panneau)
    const dist = portrait ? 14.5 : 12.0;
    const height = portrait ? 9.5 : 8.0;
    camTarget.set(focus.x, focus.y + 0.6, focus.z);
    camPos.set(focus.x - 6.5, height, focus.z + dist);
    if (snap) camera.position.copy(camPos);
    else camera.position.lerp(camPos, Math.min(1, 0.12));
    camera.lookAt(camTarget);
    return;
  }
  const dist = portrait ? 26.0 : 18.5;
  const height = portrait ? 16.5 : 12.5;
  const yaw = player.facing + 0.55;
  camTarget.set(player.pos.x, 0.85, player.pos.z);
  camPos.set(
    player.pos.x + Math.sin(yaw) * dist,
    height,
    player.pos.z + Math.cos(yaw) * dist,
  );
  if (world.labBox) {
    const tmp = camPos.clone();
    if (world.labBox.containsPoint(tmp)) {
      const c = world.labBox.getCenter(new THREE.Vector3());
      const d = tmp.clone().sub(c); d.y = 0;
      if (d.lengthSq() < 0.01) d.set(0, 0, 1);
      d.setLength(8);
      camPos.copy(c).add(d);
      camPos.y = height;
    }
  }
  if (snap) camera.position.copy(camPos);
  else camera.position.lerp(camPos, Math.min(1, 0.15));
  camera.lookAt(camTarget);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
placeCamera(true);

// Title screen
const title = document.getElementById('title');
const playBtn = document.getElementById('play');
let started = false;
function startGame() {
  if (started) return;
  started = true;
  title?.classList.add('hidden');
  input.enabled = true;
  refreshHud();
}
playBtn?.addEventListener('click', startGame);
if (params.has('autostart') || params.get('qa') === '1') startGame();

// QA capture : ouvrir une preuve et faire pousser l'arbre
if (params.get('qa') === '1' && params.get('proof')) {
  const pid = params.get('proof');
  setTimeout(() => {
    input.enabled = false;
    clearProofTree(world.proofTree);
    panel.showProof(pid);
    // Appliquer toutes les tuiles solution pour voir l'arbre complet
    const steps = (globalThis.__LT && 0) || null;
  }, 400);
  // After panel opens, step through tiles via exposed helper
  setTimeout(() => {
    if (typeof globalThis.__LT?.solveProof === 'function') globalThis.__LT.solveProof();
  }, 700);
}


refreshHud();
world.refreshLocks(save);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (started && !panel.open) {
    const mv = input.move();
    player.update(dt, mv, world.walkable);
  }
  placeCamera(camSnap);
  if (camSnap) camSnap = false;

  const near = nearestInteractable();
  if (prompt) {
    if (near && !panel.open && started) {
      prompt.classList.remove('hidden');
      prompt.textContent = near.kind === 'npc'
        ? 'E · Parler'
        : `E · ${near.zone.title}`;
    } else prompt.classList.add('hidden');
  }

  sun.target.position.set(player.pos.x, 0, player.pos.z);
  sun.position.set(player.pos.x + 26, 14, player.pos.z + 8);
  perf.tick(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Autosave périodique
setInterval(() => { if (started) persist(); }, 8000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`).catch(() => {});
}

// Expose QA helpers
globalThis.__LT = {
  save: () => save,
  teleport: (zoneId) => {
    const s = zoneSpawn(zoneId);
    player.teleport(s.x, s.z);
  },
  quality: () => perf.quality(),
  solveProof() {
    // Clique programmatique des tuiles dans l'ordre via le panneau DOM
    const btns = [...document.querySelectorAll('#panel .rule-tile')];
    const order = ['Substitution', 'Modus ponens', 'Raccourci'];
    // Pour p208: Substitution puis Raccourci — on clique la bonne à chaque fois
    const clickRight = () => {
      const labels = [...document.querySelectorAll('#panel .rule-tile')];
      // Relis le message d'aide? Plus simple: cliquer dans l'ordre solution en lisant le feedback
      for (const name of ['Substitution', 'Raccourci', 'Modus ponens']) {
        const b = labels.find((x) => x.textContent === name && !x.disabled);
        if (!b) continue;
        b.click();
        break;
      }
    };
    clickRight();
    setTimeout(clickRight, 250);
    setTimeout(clickRight, 500);
    setTimeout(clickRight, 750);
    setTimeout(() => {
      const close = document.querySelector('#panel button.ghost');
      // prefer Continuer if present
      const cont = [...document.querySelectorAll('#panel button.primary')].find(b => /Continuer|Terminer/.test(b.textContent));
      (cont || close)?.click();
      input.enabled = true;
    }, 1100);
  },
};
