/** Campus cozy : labo 1955, jardin, 5 pads de zone. */
import * as THREE from 'three';
import { ZONES, isZoneUnlocked } from './zones.js';

const SAGE = 0x6b8f71;
const CREAM = 0xf7f1e3;
const INK = 0x2c3a2f;
const GRASS = 0x8fbc8f;
const PATH = 0xe8d9b8;

function lamb(color) {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lamb(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function tree(x, z) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8), lamb(0x6b4f2a));
  trunk.position.y = 0.4;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 10), lamb(0x5f8f5a));
  crown.position.y = 1.3;
  g.add(trunk, crown);
  g.position.set(x, 0, z);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function buildWorld(scene) {
  const root = new THREE.Group();
  scene.add(root);

  // Sol
  const ground = new THREE.Mesh(new THREE.CircleGeometry(28, 48), lamb(GRASS));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // Allées
  for (const [x, z, w, d] of [[0, 0, 3.2, 22], [0, 0, 22, 3.2]]) {
    const p = box(w, 0.04, d, PATH, x, 0.02, z);
    p.castShadow = false;
    root.add(p);
  }

  // Labo central
  const lab = new THREE.Group();
  lab.add(box(6, 3.2, 5, 0xd9cbb0, 0, 1.6, 0));
  lab.add(box(6.4, 0.35, 5.4, 0x8b6b4a, 0, 3.35, 0)); // toit
  lab.add(box(1.4, 2.1, 0.15, 0x5a4030, 0, 1.05, 2.55)); // porte
  lab.add(box(1.1, 1.0, 0.1, 0xa8c8e0, -1.8, 1.8, 2.52));
  lab.add(box(1.1, 1.0, 0.1, 0xa8c8e0, 1.8, 1.8, 2.52));
  lab.position.set(0, 0, 0);
  root.add(lab);

  // Panneau labo
  const sign = box(2.2, 0.5, 0.08, SAGE, 0, 2.6, 2.6);
  root.add(sign);

  // Jardins / arbres
  for (const [x, z] of [[-12, 10], [-14, 4], [-11, -3], [12, 9], [14, 2], [11, -8], [-5, 14], [5, 14], [-14, -10], [14, -12]]) {
    root.add(tree(x, z));
  }

  // Buissons
  for (const [x, z] of [[-4, 8], [4, 8], [-6, -2], [6, -2]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), lamb(0x6a9a60));
    b.position.set(x, 0.4, z);
    b.castShadow = true;
    root.add(b);
  }

  // Pads de zone
  const pads = {};
  const markers = {};
  for (const z of ZONES) {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.7, 0.12, 20),
      lamb(z.color),
    );
    pad.position.set(z.x, 0.06, z.z);
    pad.receiveShadow = true;
    root.add(pad);
    const pillar = box(0.35, 1.4, 0.35, CREAM, z.x, 0.7, z.z - 1.5);
    root.add(pillar);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), lamb(z.color));
    gem.position.set(z.x, 1.55, z.z - 1.5);
    root.add(gem);
    pads[z.id] = pad;
    markers[z.id] = { pad, pillar, gem, zone: z };
  }

  // Socle preuves (zone 4)
  const pedestal = box(1.8, 0.55, 1.8, 0xc4b49a, 8, 0.28, -8.2);
  root.add(pedestal);
  const tileSlots = [];
  for (let i = 0; i < 3; i++) {
    const slot = box(0.5, 0.08, 0.5, CREAM, 7.2 + i * 0.55, 0.6, -8.2);
    root.add(slot);
    tileSlots.push(slot);
  }

  // Arbre de preuve (groupe vide, rempli en jeu)
  const proofTree = new THREE.Group();
  proofTree.position.set(9.5, 0, -7.2);
  root.add(proofTree);

  function walkable(x, z) {
    if (Math.hypot(x, z) > 26) return false;
    // intérieur labo bloqué sauf porte sud
    if (Math.abs(x) < 2.8 && Math.abs(z) < 2.2 && z > -2.2) return false;
    return true;
  }

  function refreshLocks(save) {
    for (const id of Object.keys(markers)) {
      const unlocked = isZoneUnlocked(save, id);
      const { pad, gem } = markers[id];
      pad.material.opacity = unlocked ? 1 : 0.35;
      pad.material.transparent = !unlocked;
      gem.visible = unlocked;
    }
  }

  return {
    root,
    pads,
    markers,
    pedestal,
    tileSlots,
    proofTree,
    walkable,
    refreshLocks,
    lab,
  };
}

export function makeLights(scene) {
  scene.background = new THREE.Color(0xdde8d8);
  scene.fog = new THREE.Fog(0xdde8d8, 22, 55);
  const hemi = new THREE.HemisphereLight(0xf5f0e0, 0x6b8f71, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
  sun.position.set(12, 22, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);
  return { hemi, sun };
}
