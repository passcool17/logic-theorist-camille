/** Sauvegarde locale versionnée — lt.camille.v1 (clé inchangée). */

export const SAVE_KEY = 'lt.camille.v1';
export const SAVE_VERSION = 1;

export function defaultSave() {
  return {
    v: SAVE_VERSION,
    chapter: 1,
    completed: {}, // { ch1: true, ... }
    proofs: {}, // { p208: true, ... }
    badges: [], // ids
    helpUsed: {},
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now(),
  };
}

/** Réglages (v9 ajoute son, volumes et mode de preuve ; les vieilles saves reçoivent les défauts). */
export const DEFAULT_SETTINGS = {
  reduceMotion: false,
  muted: false,
  music: 0.5,
  sfx: 0.8,
  proofMode: 'guided', // 'guided' | 'free'
};

const clamp01 = (x, d) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : d);

export function normalizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    reduceMotion: s.reduceMotion === true,
    muted: s.muted === true,
    music: clamp01(s.music, DEFAULT_SETTINGS.music),
    sfx: clamp01(s.sfx, DEFAULT_SETTINGS.sfx),
    proofMode: s.proofMode === 'free' ? 'free' : 'guided',
  };
}

/** Les 6 preuves de LT (badge Logicienne) et les 6 nouveaux théorèmes *2 (badge Chercheuse). */
export const CORE_IDS = ['p208', 'p202', 'p201', 'p205', 'p206', 'p285'];
export const BONUS_IDS = ['p207', 'p22', 'p221', 'p203', 'p204', 'p211'];

/** Normalise v1 ou v2 (ère 3D) en sauvegarde 2D, sans perdre completed/proofs/badges. */
export function migrateSave(data) {
  if (!data || typeof data !== 'object') return defaultSave();
  if (data.v !== 1 && data.v !== 2) return defaultSave();
  return {
    ...defaultSave(),
    chapter: Number.isFinite(data.chapter) ? data.chapter : 1,
    completed: data.completed && typeof data.completed === 'object' ? data.completed : {},
    proofs: data.proofs && typeof data.proofs === 'object' ? data.proofs : {},
    badges: Array.isArray(data.badges) ? data.badges : [],
    helpUsed: data.helpUsed && typeof data.helpUsed === 'object' ? data.helpUsed : {},
    settings: normalizeSettings(data.settings),
    v: SAVE_VERSION,
    updatedAt: data.updatedAt || Date.now(),
  };
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
  const payload = {
    v: SAVE_VERSION,
    chapter: save.chapter,
    completed: save.completed || {},
    proofs: save.proofs || {},
    badges: Array.isArray(save.badges) ? save.badges : [],
    helpUsed: save.helpUsed || {},
    settings: normalizeSettings(save.settings),
    updatedAt: Date.now(),
  };
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
  return { ...save, completed, badges: [...badges] };
}

export function markProofDone(save, proofId) {
  const proofs = { ...save.proofs, [proofId]: true };
  const badges = new Set(save.badges);
  badges.add(`proof-${proofId}`);
  if (CORE_IDS.every((id) => proofs[id])) badges.add('logicienne');
  if (BONUS_IDS.every((id) => proofs[id])) badges.add('chercheuse');
  return { ...save, proofs, badges: [...badges] };
}

/** Une preuve trouvée entièrement en mode libre. */
export function markFreeSolve(save) {
  const badges = new Set(save.badges);
  badges.add('libre');
  return { ...save, badges: [...badges] };
}

export function progressSummary(save) {
  const chaptersDone = [1, 2, 3, 4, 5].filter((n) => save.completed[`ch${n}`]).length;
  const proofsDone = Object.values(save.proofs).filter(Boolean).length;
  const coreDone = CORE_IDS.filter((id) => save.proofs[id]).length;
  const bonusDone = BONUS_IDS.filter((id) => save.proofs[id]).length;
  return { chaptersDone, proofsDone, coreDone, bonusDone, badges: save.badges.length };
}
