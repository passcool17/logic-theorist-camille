/** Sauvegarde locale versionnée — lt.camille.v1 (clé inchangée), schéma v2. */

import { ZONES, afterChapterComplete } from './3d/zones.js';

export const SAVE_KEY = 'lt.camille.v1';
export const SAVE_VERSION = 2;

export function defaultSave() {
  return {
    v: SAVE_VERSION,
    chapter: 1,
    completed: {},
    proofs: {},
    badges: [],
    helpUsed: {},
    settings: { reduceMotion: false },
    zones: { z1: true },
    pos: { x: 0, z: 4 },
    updatedAt: Date.now(),
  };
}

/** Migre v1 → v2 (zones déduites des chapitres complétés). */
export function migrateSave(data) {
  if (!data || typeof data !== 'object') return defaultSave();
  if (data.v === SAVE_VERSION) {
    return {
      ...defaultSave(),
      ...data,
      completed: data.completed || {},
      proofs: data.proofs || {},
      badges: Array.isArray(data.badges) ? data.badges : [],
      helpUsed: data.helpUsed || {},
      settings: { ...defaultSave().settings, ...(data.settings || {}) },
      zones: data.zones && typeof data.zones === 'object' ? { z1: true, ...data.zones } : { z1: true },
      pos: data.pos && Number.isFinite(data.pos.x) ? data.pos : defaultSave().pos,
      v: SAVE_VERSION,
    };
  }
  if (data.v === 1) {
    let save = {
      ...defaultSave(),
      ...data,
      v: SAVE_VERSION,
      completed: data.completed || {},
      proofs: data.proofs || {},
      badges: Array.isArray(data.badges) ? data.badges : [],
      helpUsed: data.helpUsed || {},
      settings: { ...defaultSave().settings, ...(data.settings || {}) },
      zones: { z1: true },
      pos: defaultSave().pos,
    };
    for (const z of ZONES) {
      if (save.completed[z.chapterId]) {
        save = afterChapterComplete({ ...save, completed: save.completed }, z.chapterId);
      }
    }
    return save;
  }
  return defaultSave();
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    if (!storage) return { save: defaultSave(), mode: 'memory', error: null };
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { save: defaultSave(), mode: 'local', error: null };
    const data = JSON.parse(raw);
    return { save: migrateSave(data), mode: 'local', error: null };
  } catch (e) {
    return { save: defaultSave(), mode: 'memory', error: String(e.message || e) };
  }
}

export function writeSave(save, storage = globalThis.localStorage) {
  const payload = { ...save, v: SAVE_VERSION, updatedAt: Date.now() };
  if (!storage) return { ok: false, mode: 'memory', save: payload };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(payload));
    return { ok: true, mode: 'local', save: payload };
  } catch (e) {
    return { ok: false, mode: 'memory', save: payload, error: String(e.message || e) };
  }
}

export function markChapterDone(save, chapterId) {
  const completed = { ...save.completed, [chapterId]: true };
  const badges = new Set(save.badges);
  badges.add(`ch-${chapterId}`);
  let next = { ...save, completed, badges: [...badges] };
  next = afterChapterComplete(next, chapterId);
  const meta = { ch1: 1, ch2: 2, ch3: 3, ch4: 4, ch5: 5 }[chapterId];
  if (meta) next.chapter = Math.min(5, meta + 1);
  return next;
}

export function markProofDone(save, proofId) {
  const proofs = { ...save.proofs, [proofId]: true };
  const badges = new Set(save.badges);
  badges.add(`proof-${proofId}`);
  const all = ['p208', 'p202', 'p201', 'p205', 'p206', 'p285'];
  if (all.every((id) => proofs[id])) badges.add('logicienne');
  let next = { ...save, proofs, badges: [...badges] };
  if (all.every((id) => proofs[id])) {
    next = markChapterDone(next, 'ch4');
  }
  return next;
}

export function progressSummary(save) {
  const chaptersDone = [1, 2, 3, 4, 5].filter((n) => save.completed[`ch${n}`]).length;
  const proofsDone = Object.values(save.proofs).filter(Boolean).length;
  return { chaptersDone, proofsDone, badges: save.badges.length };
}
