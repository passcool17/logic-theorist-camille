/** Sauvegarde locale versionnée — lt.camille.v1 */

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
    settings: { reduceMotion: false },
    updatedAt: Date.now(),
  };
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    if (!storage) return { save: defaultSave(), mode: 'memory', error: null };
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { save: defaultSave(), mode: 'local', error: null };
    const data = JSON.parse(raw);
    if (!data || data.v !== SAVE_VERSION) {
      return { save: defaultSave(), mode: 'local', error: 'version' };
    }
    return {
      save: {
        ...defaultSave(),
        ...data,
        completed: data.completed || {},
        proofs: data.proofs || {},
        badges: Array.isArray(data.badges) ? data.badges : [],
        helpUsed: data.helpUsed || {},
        settings: { ...defaultSave().settings, ...(data.settings || {}) },
      },
      mode: 'local',
      error: null,
    };
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
  return { ...save, completed, badges: [...badges] };
}

export function markProofDone(save, proofId) {
  const proofs = { ...save.proofs, [proofId]: true };
  const badges = new Set(save.badges);
  badges.add(`proof-${proofId}`);
  const all = ['p208', 'p202', 'p201', 'p205', 'p206', 'p285'];
  if (all.every((id) => proofs[id])) badges.add('logicienne');
  return { ...save, proofs, badges: [...badges] };
}

export function progressSummary(save) {
  const chaptersDone = [1, 2, 3, 4, 5].filter((n) => save.completed[`ch${n}`]).length;
  const proofsDone = Object.values(save.proofs).filter(Boolean).length;
  return { chaptersDone, proofsDone, badges: save.badges.length };
}
