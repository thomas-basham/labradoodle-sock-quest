import * as THREE from "three";

import {
  DOG_CONFIG,
  MARKER_CONFIG,
  PALETTE,
  SOCK_DELIVERY_OFFSETS,
} from "../game/config";

function makeStandardMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

function createMarker(scene, colorHex) {
  const marker = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.88,
  });

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 12, 32), material);
  ring.rotation.x = Math.PI / 2;
  marker.add(ring);

  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 16), material);
  arrow.position.y = 0.55;
  marker.add(arrow);

  marker.visible = false;
  scene.add(marker);
  return marker;
}

export function createSock(scene) {
  const sock = new THREE.Group();
  const sockMaterial = makeStandardMaterial(PALETTE.sock, 0.92);
  const stripeMaterial = makeStandardMaterial(PALETTE.sockStripe, 0.82);
  sockMaterial.transparent = true;
  stripeMaterial.transparent = true;

  const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.9, 14), sockMaterial);
  ankle.position.y = 0.45;
  ankle.castShadow = true;
  sock.add(ankle);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.92, 14), sockMaterial);
  foot.rotation.z = -Math.PI / 2;
  foot.position.set(0.38, 0.06, 0);
  foot.castShadow = true;
  sock.add(foot);

  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 14), sockMaterial);
  toe.position.set(0.82, 0.06, 0);
  toe.castShadow = true;
  sock.add(toe);

  for (const y of [0.18, 0.38]) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.05, 10, 24), stripeMaterial);
    stripe.position.y = y;
    stripe.rotation.x = Math.PI / 2;
    stripe.castShadow = true;
    sock.add(stripe);
  }

  scene.add(sock);
  sock.userData.materials = [sockMaterial, stripeMaterial];
  return sock;
}

export function createObjectiveMarkers(scene) {
  return {
    sockMarker: createMarker(scene, MARKER_CONFIG.sockColor),
    ownerMarker: createMarker(scene, MARKER_CONFIG.ownerColor),
  };
}

export function placeSockAt({ sock, scene, position, rotationY }) {
  const [x, y, z] = position;
  scene.attach(sock);
  sock.position.set(x, y, z);
  sock.rotation.set(Math.PI / 2, rotationY, 0.35);
  sock.scale.setScalar(1);
  setSockFocus(sock, false);
}

export function attachSockToDog({ sock, dog }) {
  dog.attach(sock);
  sock.position.set(...DOG_CONFIG.carryPosition);
  sock.rotation.set(...DOG_CONFIG.carryRotation);
  sock.scale.setScalar(1);
  setSockFocus(sock, true);
}

export function placeSockByOwner({ sock, scene, owner, deliveryIndex }) {
  const deliveryOffset = SOCK_DELIVERY_OFFSETS[deliveryIndex % SOCK_DELIVERY_OFFSETS.length];
  scene.attach(sock);
  sock.position.set(
    owner.position.x + deliveryOffset[0],
    deliveryOffset[1],
    owner.position.z + deliveryOffset[2],
  );
  sock.rotation.set(...DOG_CONFIG.deliveredRotation);
  setSockDelivered(sock);
}

export function setSockFocus(sock, isFocused) {
  const opacity = isFocused ? 1 : 0.6;
  const scale = isFocused ? 1.02 : 0.92;

  sock.userData.materials.forEach((material) => {
    material.opacity = opacity;
  });
  sock.scale.setScalar(scale);
}

export function setSockDelivered(sock) {
  sock.userData.materials.forEach((material) => {
    material.opacity = 0.96;
  });
  sock.scale.setScalar(0.92);
}
