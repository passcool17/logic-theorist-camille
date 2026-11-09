/** PNJ Newell, Simon, Shaw — capsules + têtes rondes. */
import * as THREE from 'three';

function person(coat, x, z, label) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.55, 6, 12), new THREE.MeshLambertMaterial({ color: coat }));
  body.position.y = 0.85;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), new THREE.MeshLambertMaterial({ color: 0xf0c8a8 }));
  head.position.y = 1.42;
  head.castShadow = true;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
  hair.position.set(0, 1.52, -0.03);
  hair.scale.set(1.05, 0.85, 1.0);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2a2218 }));
  eyeL.position.set(-0.07, 1.44, 0.2);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.07;
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  g.add(body, head, hair, eyeL, eyeR, blob);
  g.position.set(x, 0, z);
  g.userData = { label, kind: 'npc' };
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
