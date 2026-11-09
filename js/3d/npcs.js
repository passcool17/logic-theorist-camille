/** PNJ Newell, Simon, Shaw près des zones 2–3. */
import * as THREE from 'three';

function person(color, x, z, label) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 0.75;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshLambertMaterial({ color: 0xf0c8a8 }));
  head.position.y = 1.3;
  g.add(body, head);
  g.position.set(x, 0, z);
  g.userData = { label, kind: 'npc' };
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeNpcs(scene) {
  const list = [
    person(0x4a5a7a, 6.5, 4.5, 'Newell — « Une machine qui cherche. »'),
    person(0x7a5a4a, 9.5, 5.2, 'Simon — « Des fiches, puis le JOHNNIAC. »'),
    person(0x5a6a5a, -6.5, -4.2, 'Shaw — « IPL : le langage des listes. »'),
  ];
  for (const n of list) scene.add(n);
  return list;
}
