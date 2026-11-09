/** Camille simplifiée (3e personne) + JOHNNIAC qui suit. */
import * as THREE from 'three';

function mat(color) {
  return new THREE.MeshLambertMaterial({ color });
}

function camilleMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 10), mat('#5b3a2b'));
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), mat('#f7d9c2'));
  head.position.y = 1.45;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat('#f1c04e'));
  hair.position.set(0, 1.55, -0.04);
  hair.scale.set(1.05, 0.85, 1.1);
  g.add(body, head, hair);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function johnniacMesh() {
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.4), mat('#4F6F56'));
  torso.position.y = 0.55;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.38), mat('#6B8F71'));
  head.position.y = 1.05;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat('#F7F1E3'));
  eyeL.position.set(-0.12, 1.08, 0.2);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.12;
  const label = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.02), mat('#2C3A2F'));
  label.position.set(0, 0.45, 0.22);
  g.add(torso, head, eyeL, eyeR, label);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makePlayer(scene, start) {
  const root = new THREE.Group();
  const mesh = camilleMesh();
  root.add(mesh);
  scene.add(root);
  const pos = new THREE.Vector3(start.x, 0, start.z);
  root.position.copy(pos);
  let facing = 0;
  let phase = 0;

  const buddy = johnniacMesh();
  buddy.position.set(start.x - 1.2, 0, start.z + 0.8);
  scene.add(buddy);
  const bPos = buddy.position.clone();

  const api = {
    root,
    pos,
    buddy,
    get facing() { return facing; },
    teleport(x, z) {
      pos.set(x, 0, z);
      root.position.copy(pos);
      bPos.set(x - 1.2, 0, z + 0.8);
      buddy.position.copy(bPos);
    },
    update(dt, mv, walkable) {
      let dx = mv.x, dz = mv.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.05) {
        const sp = 4.2;
        const vx = (dx / len) * sp * dt;
        const vz = (dz / len) * sp * dt;
        if (walkable(pos.x + vx, pos.z + vz)) { pos.x += vx; pos.z += vz; }
        else if (walkable(pos.x + vx, pos.z)) pos.x += vx;
        else if (walkable(pos.x, pos.z + vz)) pos.z += vz;
        const want = Math.atan2(dx, dz);
        let dA = want - facing;
        dA = Math.atan2(Math.sin(dA), Math.cos(dA));
        facing += dA * Math.min(1, dt * 10);
        phase += dt * 8;
        mesh.position.y = Math.abs(Math.sin(phase)) * 0.05;
      } else {
        mesh.position.y = 0;
      }
      root.position.copy(pos);
      root.rotation.y = facing;

      // JOHNNIAC suit à distance
      const tx = pos.x - Math.sin(facing) * 1.3;
      const tz = pos.z - Math.cos(facing) * 1.3;
      bPos.x += (tx - bPos.x) * Math.min(1, dt * 2.5);
      bPos.z += (tz - bPos.z) * Math.min(1, dt * 2.5);
      buddy.position.copy(bPos);
      buddy.rotation.y = Math.atan2(pos.x - bPos.x, pos.z - bPos.z);
    },
  };
  return api;
}
