import * as THREE from "three";

import {
  DOG_CONFIG,
  MARKER_CONFIG,
  PALETTE,
  SOCK_SPAWN_POINTS,
} from "../game/config";
import { randomItem } from "../utils/math";

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
  resetSock({ sock, scene });
  return sock;
}

export function createObjectiveMarkers(scene) {
  return {
    sockMarker: createMarker(scene, MARKER_CONFIG.sockColor),
    ownerMarker: createMarker(scene, MARKER_CONFIG.ownerColor),
  };
}

export function resetSock({ sock, scene }) {
  const [x, y, z] = randomItem(SOCK_SPAWN_POINTS);
  scene.attach(sock);
  sock.position.set(x, y, z);
  sock.rotation.set(Math.PI / 2, Math.random() * Math.PI, 0.35);
}

export function attachSockToDog({ sock, dog }) {
  dog.attach(sock);
  sock.position.set(...DOG_CONFIG.carryPosition);
  sock.rotation.set(...DOG_CONFIG.carryRotation);
}

export function placeSockByOwner({ sock, scene, owner }) {
  scene.attach(sock);
  sock.position.set(
    owner.position.x + DOG_CONFIG.deliveredPositionOffset[0],
    DOG_CONFIG.deliveredPositionOffset[1],
    owner.position.z + DOG_CONFIG.deliveredPositionOffset[2],
  );
  sock.rotation.set(...DOG_CONFIG.deliveredRotation);
}

export function updateObjectiveMarkers({
  elapsed,
  sockMarker,
  ownerMarker,
  sock,
  owner,
  worldState,
  dogState,
}) {
  const bob = Math.sin(elapsed * MARKER_CONFIG.bobSpeed) * MARKER_CONFIG.bobHeight;

  if (!dogState.hasSock) {
    sockMarker.visible = worldState.gameStarted;
    sockMarker.position.set(sock.position.x, MARKER_CONFIG.sockHeight + bob, sock.position.z);
    sockMarker.rotation.y = elapsed * MARKER_CONFIG.sockSpinSpeed;
    ownerMarker.visible = false;
    return;
  }

  ownerMarker.visible = worldState.gameStarted;
  ownerMarker.position.set(owner.position.x, MARKER_CONFIG.ownerHeight + bob, owner.position.z);
  ownerMarker.rotation.y = elapsed * MARKER_CONFIG.ownerSpinSpeed;
  sockMarker.visible = false;
}
