/** Arbre 3D de preuve qui pousse quand une tuile est posée. */
import * as THREE from 'three';
import { pretty } from '../logic/formula.js';

export function clearProofTree(group) {
  while (group.children.length) {
    const c = group.children.pop();
    c.geometry?.dispose?.();
    c.material?.dispose?.();
  }
}

export function growProofTree(group, lines) {
  clearProofTree(group);
  const sage = new THREE.MeshLambertMaterial({ color: 0x6b8f71 });
  const cream = new THREE.MeshLambertMaterial({ color: 0xf7f1e3 });
  const accent = new THREE.MeshLambertMaterial({ color: 0xc4784a });
  lines.forEach((line, i) => {
    const y = 0.4 + i * 0.55;
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), i === lines.length - 1 ? accent : sage);
    node.position.set(0, y, 0);
    group.add(node);
    if (i > 0) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), cream);
      stem.position.set(0, y - 0.28, 0);
      group.add(stem);
    }
    // petit panneau texte via userData (HUD lit pretty)
    node.userData.label = pretty(line.formula);
  });
}
