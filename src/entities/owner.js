import * as THREE from "three";

import { PALETTE } from "../game/config";

function makeStandardMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

export function createOwner(scene) {
  const owner = new THREE.Group();
  const skin = makeStandardMaterial(0xf1caab, 0.75);
  const shirt = makeStandardMaterial(PALETTE.ownerShirt, 0.82);
  const jeans = makeStandardMaterial(PALETTE.ownerJeans, 0.9);
  const hair = makeStandardMaterial(0x423022, 0.98);
  const shoes = makeStandardMaterial(0xffffff, 0.6);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 1.6, 6, 12), shirt);
  torso.position.y = 2.8;
  torso.castShadow = true;
  owner.add(torso);

  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 12), shirt);
  hips.position.y = 1.9;
  hips.castShadow = true;
  owner.add(hips);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), skin);
  head.position.set(0, 4.3, 0);
  head.castShadow = true;
  owner.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.64, 16, 16), hair);
  hairCap.position.set(0, 4.48, -0.04);
  hairCap.scale.set(1.03, 0.8, 1.04);
  hairCap.castShadow = true;
  owner.add(hairCap);

  for (const x of [-0.42, 0.42]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.15, 4, 10), shirt);
    arm.position.set(x, 2.95, 0);
    arm.rotation.z = x > 0 ? -0.15 : 0.15;
    arm.castShadow = true;
    owner.add(arm);
  }

  for (const x of [-0.28, 0.28]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.4, 4, 10), jeans);
    leg.position.set(x, 1.0, 0);
    leg.castShadow = true;
    owner.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.8), shoes);
    shoe.position.set(x, 0.08, 0.15);
    shoe.castShadow = true;
    owner.add(shoe);
  }

  owner.position.set(0, 0.5, 16.6);
  owner.rotation.y = Math.PI;
  scene.add(owner);
  return owner;
}
