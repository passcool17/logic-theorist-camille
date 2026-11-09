/** Arbre 3D de preuve qui pousse quand une tuile est posée. */
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

export function growProofTree(group, lines) {
  clearProofTree(group);
  const sage = new THREE.MeshLambertMaterial({ color: 0x6b8f71 });
  const cream = new THREE.MeshLambertMaterial({ color: 0xf7f1e3 });
  const accent = new THREE.MeshLambertMaterial({ color: 0xc4784a });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.5 + lines.length * 0.55, 8), cream);
  trunk.position.y = (0.5 + lines.length * 0.55) / 2;
  trunk.castShadow = true;
  group.add(trunk);
  lines.forEach((line, i) => {
    const y = 0.55 + i * 0.55;
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), i === lines.length - 1 ? accent : sage);
    node.position.set((i % 2 === 0 ? -0.35 : 0.35), y, 0);
    node.castShadow = true;
    group.add(node);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), cream);
    branch.position.set(node.position.x * 0.5, y - 0.05, 0);
    branch.rotation.z = i % 2 === 0 ? 0.6 : -0.6;
    group.add(branch);
    node.userData.label = pretty(line.formula);
  });
}
