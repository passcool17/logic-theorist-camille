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
import { PROOFS } from '../logic/proofs.js';
import { TILE_LABELS } from './tiles.js';
import { followCamOffset, WALK_PITCH, PROOF_PITCH, proofFocusY } from './camera.js';

const APP_VERSION = 'lt-camille-v6';
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

const _fadeRay = new THREE.Raycaster();
const _fadeFrom = new THREE.Vector3();
const _fadeTo = new THREE.Vector3();
const _fadeDir = new THREE.Vector3();

const _roofWorld = new THREE.Vector3();
function updateRoofFade() {
  const labs = world.fadeLabs || world.fadeRoofs;
  if (!labs || !labs.length) return;
  _fadeFrom.copy(camera.position);
  _fadeTo.set(player.pos.x, 1.35, player.pos.z);
  _fadeDir.copy(_fadeTo).sub(_fadeFrom);
  const dist = _fadeDir.length();
  if (dist < 0.4) return;
  _fadeDir.multiplyScalar(1 / dist);
  _fadeRay.set(_fadeFrom, _fadeDir);
  _fadeRay.near = 0.15;
  _fadeRay.far = Math.max(0.2, dist - 0.1);
  const hits = _fadeRay.intersectObjects(labs, false);
  const hitSet = new Set(hits.map((h) => h.object));
  for (const mesh of labs) {
    mesh.getWorldPosition(_roofWorld);
    const camToMesh = _fadeFrom.distanceTo(_roofWorld);
    const nearCam = camToMesh < 6;
    const blocked = hitSet.has(mesh) || nearCam;
    const mat = mesh.material;
    const target = blocked ? (mesh.userData.fadeRoof ? 0.1 : 0.22) : 1;
    mat.opacity += (target - mat.opacity) * 0.4;
    mat.transparent = true;
    mat.depthWrite = mat.opacity > 0.85;
    mesh.castShadow = mat.opacity > 0.7;
  }
}

function placeCamera(snap = false) {
  const portrait = camera.aspect < 1;
  const focus = panel.focus;
  if (focus) {
    // Preuve : caméra un peu basse qui regarde le centre/haut de l’arbre
    // → l’arbre occupe la moitié haute, au-dessus du panneau compact.
    camera.clearViewOffset();
    // focus.y = hauteur locale du centre ; le groupe arbre est déjà surélevé (y≈1.6)
    const ty = focus.y + 1.6;
    camTarget.set(focus.x, ty + 0.4, focus.z);
    const back = portrait ? 14.0 : 12.0;
    const side = portrait ? -3.8 : -3.0;
    // Un peu plus haut / loin : arbre entier dans la zone libre au-dessus du panneau
    const camY = Math.max(3.4, ty * 0.85);
    camPos.set(focus.x + side, camY, focus.z + back);
    if (snap) camera.position.copy(camPos);
    else camera.position.lerp(camPos, Math.min(1, 0.16));
    camera.lookAt(camTarget);
    return;
  }
  const dist = portrait ? 18.0 : 14.5;
  const yaw = player.facing + 0.55;
  camTarget.set(player.pos.x, 1.2, player.pos.z);
  const off = followCamOffset({ dist, pitch: WALK_PITCH, yaw, targetY: 1.2 });
  camPos.set(player.pos.x + off.x, off.y, player.pos.z + off.z);
  // Si la caméra est au-dessus/dans le labo, pousse-la hors du bâtiment
  if (world.labBox) {
    const c = world.labBox.getCenter(new THREE.Vector3());
    const flat = new THREE.Vector3(camPos.x - c.x, 0, camPos.z - c.z);
    const minR = 10;
    if (flat.length() < minR) {
      if (flat.lengthSq() < 0.01) flat.set(Math.sin(yaw), 0, Math.cos(yaw));
      flat.setLength(minR);
      camPos.x = c.x + flat.x;
      camPos.z = c.z + flat.z;
    }
  }
  // Recalcule la hauteur pour garder le pitch même après évitement
  const horiz = Math.hypot(camPos.x - camTarget.x, camPos.z - camTarget.z);
  camPos.y = camTarget.y + Math.tan(WALK_PITCH) * Math.max(horiz, 10);
  camera.clearViewOffset();
  if (snap) camera.position.copy(camPos);
  else camera.position.lerp(camPos, Math.min(1, 0.18));
  camera.lookAt(camTarget);
  updateRoofFade();
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  if (!panel.focus) camera.clearViewOffset();
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
  pos: () => ({ x: player.pos.x, z: player.pos.z }),
  teleport: (zoneId) => {
    const s = zoneSpawn(zoneId);
    player.teleport(s.x, s.z);
  },
  openProof(proofId) {
    input.enabled = false;
    clearProofTree(world.proofTree);
    panel.showProof(proofId);
  },
  quality: () => perf.quality(),
  solveProof(opts = {}) {
    const finish = opts.finish !== false;
    const proofId = opts.proofId || document.querySelector('#panel .panel-card')?.dataset?.proofId;
    const proof = PROOFS.find((p) => p.id === proofId) || PROOFS[0];
    const steps = proof.solution.map((s) => TILE_LABELS[s.rule]);
    steps.forEach((name, i) => {
      setTimeout(() => {
        const labels = [...document.querySelectorAll('#panel .rule-tile')];
        const b = labels.find((x) => x.textContent === name);
        b?.click();
      }, 200 + i * 280);
    });
    if (finish) {
      setTimeout(() => {
        const close = document.querySelector('#panel button.ghost');
        const cont = [...document.querySelectorAll('#panel button.primary')].find(b => /Continuer|Terminer/.test(b.textContent));
        (cont || close)?.click();
        input.enabled = true;
      }, 200 + steps.length * 280 + 400);
    }
  },
};
