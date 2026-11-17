/**
 * Son du jeu — Web Audio, sans dépendance.
 * Bus : destination ← maître ← { musique, effets }. Les curseurs 0..1 sont mis au carré
 * (courbe plus naturelle à l’oreille) ; 0 = silence vrai.
 * Rien ne joue avant le premier geste de Camille (règle des navigateurs mobiles).
 * Effets synthétisés (aucun fichier) ; musique : un seul MP3 en boucle (MusicGen, voir GAME.md).
 */

export const MUSIC_URL = './assets/audio/music-loop.mp3';

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let musicBuf = null;
let musicLoading = null;
let musicSrc = null;
let noiseBuf = null;
let musicLoop = null;

/**
 * Le MP3 ajoute un peu de silence au début et à la fin (délai de l’encodeur).
 * On boucle seulement sur la partie sonore, sinon on entendrait un petit trou.
 */
function loopBounds(buf) {
  const d = buf.getChannelData(0);
  const eps = 1e-4;
  let a = 0;
  let b = d.length - 1;
  const max = Math.min(d.length >> 2, buf.sampleRate); // on ne cherche pas plus loin que 1 s
  while (a < max && Math.abs(d[a]) < eps) a++;
  while (b > d.length - max && Math.abs(d[b]) < eps) b--;
  return { start: a / buf.sampleRate, end: (b + 1) / buf.sampleRate };
}
let unlocked = false;
let lastSpecific = -1e9;
let suspendTimer = 0;
let settings = { muted: false, music: 0.5, sfx: 0.8 };

const gain01 = (x) => Math.max(0, Math.min(1, x)) ** 2;

function now() {
  return ctx ? ctx.currentTime : 0;
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC({ latencyHint: 'interactive' });
  master = ctx.createGain();
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  // Petit compresseur doux : évite les pics quand plusieurs sons se superposent.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(comp).connect(ctx.destination);
  applyGains(true);
  return ctx;
}

function ramp(param, value, t = 0.12) {
  const n = now();
  param.cancelScheduledValues(n);
  param.setValueAtTime(param.value, n);
  param.linearRampToValueAtTime(value, n + t);
}

function applyGains(instant = false) {
  if (!ctx) return;
  const t = instant ? 0.001 : 0.15;
  ramp(master.gain, settings.muted ? 0 : 1, t);
  ramp(musicBus.gain, gain01(settings.music) * 0.55, t);
  ramp(sfxBus.gain, gain01(settings.sfx), t);
}

function wantMusic() {
  return unlocked && !settings.muted && settings.music > 0 && document.visibilityState !== 'hidden';
}

async function loadMusic() {
  if (musicBuf) return musicBuf;
  if (!musicLoading) {
    musicLoading = fetch(MUSIC_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`musique ${r.status}`))))
      .then((ab) => ctx.decodeAudioData(ab))
      .then((buf) => {
        musicBuf = buf;
        musicLoop = loopBounds(buf);
        return buf;
      })
      .catch(() => {
        musicLoading = null; // on réessaiera au prochain geste
        return null;
      });
  }
  return musicLoading;
}

async function syncMusic() {
  if (!ctx) return;
  if (!wantMusic()) {
    if (musicSrc) {
      const src = musicSrc;
      musicSrc = null;
      try { src.stop(now() + 0.3); } catch { /* déjà arrêtée */ }
    }
    return;
  }
  if (musicSrc) return;
  const buf = await loadMusic();
  if (!buf || musicSrc || !wantMusic()) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  if (musicLoop && musicLoop.end > musicLoop.start + 1) {
    src.loopStart = musicLoop.start;
    src.loopEnd = musicLoop.end;
  }
  const fade = ctx.createGain();
  fade.gain.setValueAtTime(0, now());
  fade.gain.linearRampToValueAtTime(1, now() + 2.5);
  src.connect(fade).connect(musicBus);
  src.start(0, musicLoop ? musicLoop.start : 0);
  musicSrc = src;
}

/** Appelé au premier geste (pointerdown / keydown). */
export function unlockAudio() {
  if (!ensureCtx()) return;
  unlocked = true;
  if (ctx.state === 'suspended' && !settings.muted) ctx.resume().catch(() => {});
  syncMusic();
}

export function configureAudio(next) {
  settings = { ...settings, ...next };
  if (!ctx) return;
  applyGains();
  if (settings.muted) {
    syncMusic();
    // Muet : on met le contexte en pause après le fondu (moins de batterie).
    clearTimeout(suspendTimer);
    suspendTimer = setTimeout(() => {
      if (settings.muted && ctx.state === 'running') ctx.suspend().catch(() => {});
    }, 400);
  } else {
    if (unlocked && ctx.state === 'suspended' && document.visibilityState !== 'hidden') ctx.resume().catch(() => {});
    syncMusic();
  }
}

export function audioState() {
  return {
    unlocked,
    context: ctx ? ctx.state : 'none',
    musicPlaying: !!musicSrc,
    musicLoaded: !!musicBuf,
    ...settings,
  };
}

/* ---------- effets synthétisés (doux, courts) ---------- */

function tone({ freq, to = freq, dur = 0.12, type = 'sine', vol = 0.18, at = 0, attack = 0.006, filter = 0 }) {
  const t0 = now() + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = osc.connect(g);
  if (filter) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    out = out.connect(lp);
  }
  out.connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function whoosh() {
  if (!noiseBuf) {
    const len = Math.floor(ctx.sampleRate * 0.4);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = now();
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(500, t0);
  bp.frequency.exponentialRampToValueAtTime(1800, t0 + 0.32);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.36);
  src.connect(bp).connect(g).connect(sfxBus);
  src.start(t0);
  src.stop(t0 + 0.4);
}

const vary = (f) => f * (1 + (Math.random() - 0.5) * 0.04); // ±2 % : pas d’effet « mitraillette »

const SOUNDS = {
  tap: () => tone({ freq: vary(700), to: 560, dur: 0.06, vol: 0.09 }),
  select: () => tone({ freq: vary(880), to: 990, dur: 0.08, vol: 0.08, type: 'triangle' }),
  step: () => {
    tone({ freq: 784, dur: 0.4, vol: 0.12, type: 'sine' });
    tone({ freq: 1175, dur: 0.3, vol: 0.05, type: 'sine', at: 0.01 });
  },
  success: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.55, vol: 0.11, type: 'triangle', at: i * 0.09, filter: 3200 }));
  },
  fail: () => {
    tone({ freq: 330, to: 294, dur: 0.18, vol: 0.1, type: 'triangle', filter: 1200 });
    tone({ freq: 262, to: 247, dur: 0.28, vol: 0.09, type: 'triangle', at: 0.14, filter: 1000 });
  },
  page: () => whoosh(),
};

/**
 * Joue un effet. `generic` = le petit « tic » d’un bouton : ignoré si un son plus précis
 * vient d’être joué pour le même toucher.
 */
export function sfx(name, { generic = false } = {}) {
  const t = performance.now();
  if (generic && t - lastSpecific < 80) return;
  if (!generic) lastSpecific = t;
  if (!ctx || !unlocked || settings.muted || settings.sfx <= 0 || ctx.state !== 'running') return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* un son raté ne doit jamais casser le jeu */
  }
}

/** Pause quand l’onglet est caché (batterie), reprise au retour. */
export function installAudioLifecycle() {
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !unlocked) return;
    if (document.visibilityState === 'hidden') {
      syncMusic();
      ctx.suspend().catch(() => {});
    } else if (!settings.muted) {
      ctx.resume().catch(() => {});
      syncMusic();
    }
  });
  const first = () => {
    unlockAudio();
  };
  // Chaque geste peut relancer un contexte suspendu par le système (appel, autre app…).
  window.addEventListener('pointerdown', first, { capture: true, passive: true });
  window.addEventListener('keydown', first, { capture: true });
}
