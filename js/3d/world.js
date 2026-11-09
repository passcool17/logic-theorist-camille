/** Campus cozy détaillé : labo 1955, jardin, herbe instanciée, lumière dorée. */
import * as THREE from 'three';
import { ZONES, isZoneUnlocked } from './zones.js';
import { IS_TOUCH } from './perf.js';

const MAT = new Map();
function lamb(color, opts = {}) {
  const key = `${color}|${opts.flat ? 1 : 0}|${opts.transparent ? 1 : 0}|${opts.opacity ?? 1}`;
  if (!MAT.has(key)) {
    MAT.set(key, new THREE.MeshLambertMaterial({
      color,
      flatShading: !!opts.flat,
      transparent: !!opts.transparent,
      opacity: opts.opacity ?? 1,
    }));
  }
  return MAT.get(key);
}

function mesh(geo, color, opts) {
  const m = new THREE.Mesh(geo, lamb(color, opts));
  m.castShadow = !opts?.noShadow;
  m.receiveShadow = true;
  return m;
}

function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}

/** Arbre arrondi (tronc + 2–3 boules). */
function roundTree(x, z, scale = 1, hue = 0x5f8f5a) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.14 * scale, 0.2 * scale, 0.9 * scale, 8), 0x6b4f2a);
  trunk.position.y = 0.45 * scale;
  const c1 = mesh(new THREE.SphereGeometry(0.85 * scale, 12, 10), hue);
  c1.position.y = 1.35 * scale;
  const c2 = mesh(new THREE.SphereGeometry(0.55 * scale, 10, 8), hue);
  c2.position.set(0.35 * scale, 1.55 * scale, 0.1 * scale);
  const c3 = mesh(new THREE.SphereGeometry(0.45 * scale, 10, 8), 0x6fa05f);
  c3.position.set(-0.3 * scale, 1.45 * scale, -0.15 * scale);
  g.add(trunk, c1, c2, c3);
  g.position.set(x, 0, z);
  return g;
}

function bush(x, z, s = 1) {
  const g = new THREE.Group();
  for (const [ox, oy, oz, r] of [[0, 0.35, 0, 0.45], [0.25, 0.3, 0.1, 0.32], [-0.2, 0.28, -0.1, 0.3]]) {
    g.add(at(mesh(new THREE.SphereGeometry(r * s, 10, 8), 0x6a9a60), ox * s, oy * s, oz * s));
  }
  g.position.set(x, 0, z);
  return g;
}

function flower(x, z, color) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.35, 5), 0x4a7a40, { noShadow: true });
  stem.position.y = 0.18;
  const petal = mesh(new THREE.SphereGeometry(0.08, 8, 6), color, { noShadow: true });
  petal.position.y = 0.38;
  g.add(stem, petal);
  g.position.set(x, 0, z);
  return g;
}

function bench(x, z, rot = 0) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.BoxGeometry(1.4, 0.08, 0.4), 0x8b6914), 0, 0.42, 0));
  g.add(at(mesh(new THREE.BoxGeometry(1.4, 0.35, 0.06), 0x8b6914), 0, 0.55, -0.18));
  g.add(at(mesh(new THREE.BoxGeometry(0.08, 0.42, 0.4), 0x6b4f2a), -0.6, 0.21, 0));
  g.add(at(mesh(new THREE.BoxGeometry(0.08, 0.42, 0.4), 0x6b4f2a), 0.6, 0.21, 0));
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

function lampPost(x, z) {
  const g = new THREE.Group();
  g.add(at(mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), 0x3a3a42), 0, 1.1, 0));
  const lamp = mesh(new THREE.SphereGeometry(0.18, 10, 8), 0xffe6b0);
  lamp.position.y = 2.25;
  g.add(lamp);
  g.position.set(x, 0, z);
  return g;
}

/** Herbe instanciée (allégée sur tactile). */
function addGrass(root, walkable) {
  const n = IS_TOUCH ? 420 : 900;
  const geo = new THREE.ConeGeometry(0.06, 0.28, 4);
  geo.translate(0, 0.14, 0);
  const mat = new THREE.MeshLambertMaterial({ color: 0x6cb946 });
  const im = new THREE.InstancedMesh(geo, mat, n);
  im.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let seed = 424242;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let k = 0;
  for (let tries = 0; k < n && tries < n * 5; tries++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 22;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (!walkable(x, z)) continue;
    if (Math.abs(x) < 2 && Math.abs(z) < 12) continue; // allées
    if (Math.abs(z) < 2 && Math.abs(x) < 12) continue;
    const sc = 0.7 + rnd() * 0.9;
    p.set(x, 0, z);
    q.setFromAxisAngle(up, rnd() * 6.28);
    s.set(sc, sc * (0.85 + rnd() * 0.4), sc);
    m4.compose(p, q, s);
    im.setMatrixAt(k++, m4);
  }
  im.count = k;
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  root.add(im);
  return im;
}

function buildLab() {
  const lab = new THREE.Group();
  // Murs
  lab.add(at(mesh(new THREE.BoxGeometry(7.2, 3.4, 5.6), 0xe8dcc4), 0, 1.7, 0));
  // Toit à deux pans (approximation)
  const roofL = mesh(new THREE.BoxGeometry(7.8, 0.22, 3.2), 0x8b5a3c);
  roofL.position.set(0, 3.55, -1.2);
  roofL.rotation.x = 0.28;
  const roofR = mesh(new THREE.BoxGeometry(7.8, 0.22, 3.2), 0x9a6545);
  roofR.position.set(0, 3.55, 1.2);
  roofR.rotation.x = -0.28;
  lab.add(roofL, roofR);
  // Faîte
  lab.add(at(mesh(new THREE.BoxGeometry(7.9, 0.15, 0.35), 0x6b4030), 0, 3.95, 0));
  // Porte
  lab.add(at(mesh(new THREE.BoxGeometry(1.35, 2.2, 0.12), 0x5a3a28), 0, 1.1, 2.82));
  lab.add(at(mesh(new THREE.SphereGeometry(0.05, 8, 8), 0xd4af37, { noShadow: true }), 0.45, 1.1, 2.9));
  // Fenêtres
  for (const x of [-2.2, 2.2]) {
    lab.add(at(mesh(new THREE.BoxGeometry(1.2, 1.15, 0.1), 0x9ec8e6), x, 2.0, 2.82));
    lab.add(at(mesh(new THREE.BoxGeometry(1.3, 1.25, 0.06), 0x5a4030, { noShadow: true }), x, 2.0, 2.78));
  }
  // Enseigne
  lab.add(at(mesh(new THREE.BoxGeometry(2.6, 0.55, 0.1), 0x6b8f71), 0, 2.85, 2.9));
  // Intérieur visible : tableau + fiches + armoire JOHNNIAC (devant la porte, un peu en retrait)
  const board = mesh(new THREE.BoxGeometry(2.4, 1.3, 0.08), 0x2f4a32);
  board.position.set(-1.6, 1.9, -2.4);
  lab.add(board);
  // Fiches sur table
  const table = mesh(new THREE.BoxGeometry(1.6, 0.1, 0.9), 0xc4a574);
  table.position.set(1.5, 0.85, -1.5);
  lab.add(table);
  lab.add(at(mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), 0x8b6914), 0.85, 0.42, -1.2));
  lab.add(at(mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), 0x8b6914), 2.15, 0.42, -1.8));
  for (let i = 0; i < 5; i++) {
    const card = mesh(new THREE.BoxGeometry(0.22, 0.02, 0.28), 0xf7f1e3, { noShadow: true });
    card.position.set(1.1 + i * 0.18, 0.92, -1.35 - (i % 2) * 0.15);
    lab.add(card);
  }
  // Armoire JOHNNIAC (rack)
  const rack = mesh(new THREE.BoxGeometry(1.1, 2.4, 0.7), 0x4a5560);
  rack.position.set(2.4, 1.2, 0.2);
  lab.add(rack);
  for (let i = 0; i < 4; i++) {
    const panel = mesh(new THREE.BoxGeometry(0.9, 0.35, 0.05), i % 2 ? 0x6b8f71 : 0x3a4048, { noShadow: true });
    panel.position.set(2.4, 0.55 + i * 0.5, 0.56);
    lab.add(panel);
  }
  // Seuil
  lab.add(at(mesh(new THREE.BoxGeometry(1.8, 0.08, 0.6), 0xd9cbb0), 0, 0.04, 3.1));
  return lab;
}

export function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);

  // Sol herbeux
  const ground = mesh(new THREE.CircleGeometry(30, 64), 0x7eb86a, { flat: false });
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.castShadow = false;
  root.add(ground);

  // Allées crème
  for (const [x, z, w, d] of [[0, 0, 3.4, 24], [0, 0, 24, 3.4]]) {
    const p = mesh(new THREE.BoxGeometry(w, 0.05, d), 0xe8d9b8);
    p.position.set(x, 0.025, z);
    p.castShadow = false;
    root.add(p);
  }
  // Carrefour rond
  const plaza = mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.06, 28), 0xefe2c4);
  plaza.position.y = 0.03;
  plaza.castShadow = false;
  root.add(plaza);

  root.add(buildLab());

  // Végétation
  const treeSpots = [
    [-12, 10, 1.1], [-14, 5, 0.95], [-11, -2, 1.2], [-13, -9, 1],
    [12, 9, 1.05], [14, 3, 0.9], [11, -7, 1.15], [13, -12, 1],
    [-6, 13, 0.85], [6, 13, 0.9], [-16, 0, 1.1], [16, -2, 1],
  ];
  for (const [x, z, s] of treeSpots) root.add(roundTree(x, z, s));

  for (const [x, z] of [[-4.5, 7], [4.5, 7], [-7, -1.5], [7, -1.5], [-3, -10], [3, -10], [-9, 8], [9, 8]]) {
    root.add(bush(x, z, 0.9 + (Math.abs(x) % 5) * 0.05));
  }

  const flowerColors = [0xf2a6b0, 0xf5d76e, 0xc5a0e0, 0xffb347];
  let fi = 0;
  for (const [x, z] of [[-5, 5], [-4.2, 5.5], [5, 5.2], [4.3, 4.8], [-8, -5], [-7.4, -5.5], [8, -4.5], [7.5, -5], [1.5, 9], [-1.5, 9.2]]) {
    root.add(flower(x, z, flowerColors[fi++ % flowerColors.length]));
  }

  root.add(bench(-3.5, 4.2, 0.4));
  root.add(bench(3.5, 4.2, -0.4));
  root.add(bench(-5, -7.5, 1.2));
  root.add(lampPost(-5.5, 3));
  root.add(lampPost(5.5, 3));
  root.add(lampPost(-5.5, -8));
  root.add(lampPost(5.5, -8));

  // Pads de zone
  const pads = {};
  const markers = {};
  for (const z of ZONES) {
    const pad = mesh(new THREE.CylinderGeometry(1.7, 1.85, 0.14, 24), z.color);
    pad.position.set(z.x, 0.07, z.z);
    root.add(pad);
    const pillar = mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.5, 10), 0xf7f1e3);
    pillar.position.set(z.x, 0.75, z.z - 1.55);
    root.add(pillar);
    const gem = mesh(new THREE.OctahedronGeometry(0.32, 0), z.color);
    gem.position.set(z.x, 1.65, z.z - 1.55);
    root.add(gem);
    pads[z.id] = pad;
    markers[z.id] = { pad, pillar, gem, zone: z };
  }

  // Socle preuves (zone 4)
  const pedestal = mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.6, 16), 0xc4b49a);
  pedestal.position.set(8, 0.3, -8.3);
  root.add(pedestal);
  const tileSlots = [];
  for (let i = 0; i < 3; i++) {
    const slot = mesh(new THREE.BoxGeometry(0.48, 0.1, 0.48), 0xf7f1e3);
    slot.position.set(7.15 + i * 0.55, 0.65, -8.3);
    root.add(slot);
    tileSlots.push(slot);
  }

  const proofTree = new THREE.Group();
  proofTree.position.set(9.6, 0, -7.3);
  root.add(proofTree);

  function walkable(x, z) {
    if (Math.hypot(x, z) > 27) return false;
    // labo plein sauf porte sud
    if (Math.abs(x) < 3.3 && z > -2.5 && z < 2.5) return false;
    return true;
  }

  addGrass(root, walkable);

  function refreshLocks(save) {
    for (const id of Object.keys(markers)) {
      const unlocked = isZoneUnlocked(save, id);
      const { pad, gem } = markers[id];
      pad.material = lamb(markers[id].zone.color, { transparent: !unlocked, opacity: unlocked ? 1 : 0.4 });
      gem.visible = unlocked;
    }
  }

  // Lab AABB for camera avoidance
  const labBox = new THREE.Box3(
    new THREE.Vector3(-3.8, 0, -3.0),
    new THREE.Vector3(3.8, 4.2, 3.2),
  );

  return {
    root, pads, markers, pedestal, tileSlots, proofTree,
    walkable, refreshLocks, labBox,
  };
}

/** Ciel dégradé + lumière dorée (fin d’après-midi). */
export function makeLights(scene) {
  // Shader ciel
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0xe98a5c) },
      bot: { value: new THREE.Color(0xffe5b8) },
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 p = modelMatrix * vec4(position,1.0); vW = normalize(p.xyz); gl_Position = projectionMatrix * viewMatrix * p; }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vW; void main(){ float h = clamp(vW.y * 0.5 + 0.5, 0.0, 1.0); vec3 c = mix(bot, top, pow(h, 0.85)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 16), skyMat);
  sky.renderOrder = -1;
  scene.add(sky);

  scene.fog = new THREE.Fog(0xf0c49a, 28, 70);
  scene.background = new THREE.Color(0xf0c49a);

  const hemi = new THREE.HemisphereLight(0xffe0c0, 0x6b8f55, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffb06a, 2.2);
  sun.position.set(28, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 70;
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22 });
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun);
  scene.add(sun.target);

  return { hemi, sun, sky };
}
