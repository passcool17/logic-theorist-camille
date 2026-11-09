/** Arbre 3D de preuve qui pousse quand une tuile est posée (échelle lisible mobile). */
import * as THREE from 'three';
import { pretty } from '../logic/formula.js';

export function clearProofTree(group) {
  while (group.children.length) {
    const c = group.children.pop();
    c.geometry?.dispose?.();
    if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
    else c.material?.dispose?.();
  }
}

/** Espacement vertical entre nœuds (exporté pour les tests / focus caméra). */
export const NODE_STEP = 1.15;
export const NODE_RADIUS = 0.48;

export function growProofTree(group, lines) {
  clearProofTree(group);
  const sage = new THREE.MeshLambertMaterial({ color: 0x6b8f71 });
  const cream = new THREE.MeshLambertMaterial({ color: 0xf7f1e3 });
  const accent = new THREE.MeshLambertMaterial({ color: 0xc4784a });
  const trunkH = 1.1 + lines.length * NODE_STEP;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, trunkH, 10), cream);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);
  lines.forEach((line, i) => {
    const y = 1.0 + i * NODE_STEP;
    const side = i % 2 === 0 ? -0.85 : 0.85;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(NODE_RADIUS, 14, 12),
      i === lines.length - 1 ? accent : sage,
    );
    node.position.set(side, y, 0);
    node.castShadow = true;
    group.add(node);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), cream);
    branch.position.set(side * 0.5, y - 0.08, 0);
    branch.rotation.z = i % 2 === 0 ? 0.7 : -0.7;
    group.add(branch);
    node.userData.label = pretty(line.formula);
  });
  group.userData.lineCount = lines.length;
  group.userData.treeHeight = trunkH;
}
