/** Clavier WASD/flèches + E, joystick tactile (#stick/#knob/#act). */

export function makeInput({ onInteract, onKey } = {}) {
  const down = new Set();
  const MOVE = {
    KeyW: [0, -1], ArrowUp: [0, -1],
    KeyS: [0, 1], ArrowDown: [0, 1],
    KeyA: [-1, 0], ArrowLeft: [-1, 0],
    KeyD: [1, 0], ArrowRight: [1, 0],
  };
  let enabled = true;
  const typing = () => document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);

  addEventListener('keydown', (e) => {
    if (typing()) return;
    if (onKey && onKey(e) === true) { e.preventDefault(); return; }
    if (!enabled) return;
    if (MOVE[e.code]) { down.add(e.code); e.preventDefault(); }
    if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) {
      e.preventDefault();
      onInteract && onInteract();
    }
  });
  addEventListener('keyup', (e) => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  const joy = { x: 0, z: 0, id: null };
  const stick = document.getElementById('stick');
  const knob = document.getElementById('knob');
  const act = document.getElementById('act');
  if (stick && knob) {
    const set = (e) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const max = r.width / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > max) { dx *= max / d; dy *= max / d; }
      joy.x = dx / max;
      joy.z = dy / max;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    };
    stick.addEventListener('pointerdown', (e) => {
      joy.id = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      set(e);
      e.preventDefault();
    });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) set(e); });
    const end = (e) => {
      if (e.pointerId !== joy.id) return;
      joy.id = null;
      joy.x = joy.z = 0;
      knob.style.transform = '';
    };
    stick.addEventListener('pointerup', end);
    stick.addEventListener('pointercancel', end);
  }
  if (act) {
    act.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (enabled && onInteract) onInteract();
    });
    act.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  }

  return {
    move() {
      if (!enabled) return { x: 0, z: 0 };
      let x = 0, z = 0;
      for (const c of down) if (MOVE[c]) { x += MOVE[c][0]; z += MOVE[c][1]; }
      const l = Math.hypot(x, z);
      if (l > 0) { x /= l; z /= l; }
      if (Math.hypot(joy.x, joy.z) > 0.15) { x = joy.x; z = joy.z; }
      return { x, z };
    },
    set enabled(v) { enabled = v; if (!v) down.clear(); },
    get enabled() { return enabled; },
  };
}
