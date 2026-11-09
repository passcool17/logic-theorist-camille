/** Camille et JOHNNIAC — formes arrondies, visage simple. */
import * as THREE from 'three';

function M(color) {
  return new THREE.MeshLambertMaterial({ color });
}
function part(geo, color, x, y, z, scale) {
  const m = new THREE.Mesh(geo, M(color));
  m.position.set(x, y, z);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function camilleMesh() {
  const g = new THREE.Group();
  // Corps coton ouaté brun arrondi
  g.add(part(new THREE.CapsuleGeometry(0.32, 0.5, 6, 12), '#5b3a2b', 0, 0.95, 0));
  // Tête
  g.add(part(new THREE.SphereGeometry(0.28, 16, 14), '#f7d9c2', 0, 1.52, 0));
  // Cheveux boule + mèches
  g.add(part(new THREE.SphereGeometry(0.3, 14, 12), '#f1c04e', 0, 1.62, -0.04, [1.08, 0.9, 1.05]));
  g.add(part(new THREE.SphereGeometry(0.12, 10, 8), '#ffe08a', -0.22, 1.48, 0.12));
  g.add(part(new THREE.SphereGeometry(0.12, 10, 8), '#ffe08a', 0.22, 1.48, 0.12));
  // Yeux
  g.add(part(new THREE.SphereGeometry(0.045, 8, 6), '#3a2a22', -0.09, 1.54, 0.24, [1, 1, 0.7]));
  g.add(part(new THREE.SphereGeometry(0.045, 8, 6), '#3a2a22', 0.09, 1.54, 0.24, [1, 1, 0.7]));
  // Joues
  g.add(part(new THREE.SphereGeometry(0.05, 8, 6), '#f4a9a0', -0.16, 1.45, 0.2, [1, 0.7, 0.5]));
  g.add(part(new THREE.SphereGeometry(0.05, 8, 6), '#f4a9a0', 0.16, 1.45, 0.2, [1, 0.7, 0.5]));
  // Sac rose
  g.add(part(new THREE.CapsuleGeometry(0.16, 0.2, 4, 10), '#ff4fa8', 0, 1.0, -0.32, [1.1, 1, 0.7]));
  // Jambes
  g.add(part(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), '#a9c9e8', -0.14, 0.35, 0));
  g.add(part(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), '#a9c9e8', 0.14, 0.35, 0));
  // Ombre blob
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  g.add(blob);
  return g;
}

function johnniacMesh() {
  const g = new THREE.Group();
  // Corps arrondi (pas un cube)
  g.add(part(new THREE.CapsuleGeometry(0.38, 0.45, 6, 12), '#4F6F56', 0, 0.65, 0));
  g.add(part(new THREE.SphereGeometry(0.36, 14, 12), '#6B8F71', 0, 1.2, 0));
  // Visage
  g.add(part(new THREE.SphereGeometry(0.07, 10, 8), '#F7F1E3', -0.12, 1.22, 0.3));
  g.add(part(new THREE.SphereGeometry(0.07, 10, 8), '#F7F1E3', 0.12, 1.22, 0.3));
  g.add(part(new THREE.SphereGeometry(0.03, 8, 6), '#2C3A2F', -0.12, 1.22, 0.36));
  g.add(part(new THREE.SphereGeometry(0.03, 8, 6), '#2C3A2F', 0.12, 1.22, 0.36));
  // Antenne
  g.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6), '#3a4a3e', 0, 1.55, 0));
  g.add(part(new THREE.SphereGeometry(0.06, 8, 6), '#c4784a', 0, 1.7, 0));
  // Panneau poitrine
  g.add(part(new THREE.BoxGeometry(0.35, 0.2, 0.05), '#2C3A2F', 0, 0.7, 0.35));
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 14),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.02;
  g.add(blob);
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
  buddy.position.set(start.x - 1.4, 0, start.z + 1.0);
  scene.add(buddy);
  const bPos = buddy.position.clone();

  return {
    root,
    pos,
    buddy,
    get facing() { return facing; },
    teleport(x, z) {
      pos.set(x, 0, z);
      root.position.copy(pos);
      bPos.set(x - 1.4, 0, z + 1.0);
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
        mesh.position.y = Math.abs(Math.sin(phase)) * 0.04;
      } else {
        mesh.position.y = 0;
      }
      root.position.copy(pos);
      root.rotation.y = facing;

      const tx = pos.x - Math.sin(facing) * 1.5;
      const tz = pos.z - Math.cos(facing) * 1.5;
      bPos.x += (tx - bPos.x) * Math.min(1, dt * 2.2);
      bPos.z += (tz - bPos.z) * Math.min(1, dt * 2.2);
      buddy.position.copy(bPos);
      buddy.rotation.y = Math.atan2(pos.x - bPos.x, pos.z - bPos.z);
    },
  };
}
