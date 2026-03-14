import * as THREE from "three";

import {
  DOG_CONFIG,
  MARKER_CONFIG,
  PALETTE,
  ROUND_CONFIG,
  SNIFF_CONFIG,
  SOCK_SPAWN_POINTS,
} from "../game/config";
import { takeRandomItems } from "../utils/math";
import {
  attachSockToDog,
  createObjectiveMarkers,
  createSock,
  placeSockAt,
  placeSockByOwner,
  setSockDelivered,
  setSockFocus,
} from "./sock";

const UP_VECTOR = new THREE.Vector3(0, 1, 0);
const trailDirection = new THREE.Vector3();
const trailSide = new THREE.Vector3();
const trailPosition = new THREE.Vector3();

function createPulseRing(scene) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.62, 24),
    new THREE.MeshBasicMaterial({
      color: PALETTE.scent,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  return ring;
}

function createScentPuff(scene, index) {
  const puff = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshBasicMaterial({
      color: PALETTE.scentGlow,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  puff.visible = false;
  puff.userData.basePosition = new THREE.Vector3();
  puff.userData.phase = index * 0.65;
  scene.add(puff);
  return puff;
}

export class SockManager {
  constructor({ scene, dog, owner }) {
    this.scene = scene;
    this.dog = dog;
    this.owner = owner;
    this.totalSocks = ROUND_CONFIG.socksPerRound;
    this.socks = Array.from({ length: this.totalSocks }, () => createSock(scene));
    this.markers = createObjectiveMarkers(scene);
    this.activeIndex = 0;
    this.returnedCount = 0;
    this.carriedSock = null;
    this.sniffTimer = 0;
    this.sniffOrigin = new THREE.Vector3();
    this.sniffTarget = new THREE.Vector3();
    this.sniffRings = Array.from({ length: 3 }, () => createPulseRing(scene));
    this.sniffTrail = Array.from(
      { length: SNIFF_CONFIG.trailPuffCount },
      (_, index) => createScentPuff(scene, index),
    );
  }

  getReturnedCount() {
    return this.returnedCount;
  }

  getTotalSocks() {
    return this.totalSocks;
  }

  isCarryingSock() {
    return this.carriedSock !== null;
  }

  getActiveSock() {
    if (this.activeIndex >= this.socks.length) {
      return null;
    }

    return this.socks[this.activeIndex];
  }

  getActiveSockWorldPosition(target) {
    const activeSock = this.getActiveSock();
    if (!activeSock || this.carriedSock) {
      return null;
    }

    return activeSock.getWorldPosition(target);
  }

  clearSniffEffects() {
    this.sniffTimer = 0;

    this.sniffRings.forEach((ring) => {
      ring.visible = false;
      ring.material.opacity = 0;
    });

    this.sniffTrail.forEach((puff) => {
      puff.visible = false;
      puff.material.opacity = 0;
    });
  }

  activateSniff() {
    const target = this.getActiveSockWorldPosition(this.sniffTarget);
    if (!target) {
      return false;
    }

    this.dog.userData.nose.getWorldPosition(this.sniffOrigin);
    this.sniffOrigin.y = Math.max(this.sniffOrigin.y, 1.4);
    this.sniffTimer = SNIFF_CONFIG.effectDurationSeconds;

    trailDirection.copy(target).sub(this.sniffOrigin);
    if (trailDirection.lengthSq() === 0) {
      trailDirection.set(1, 0, 0);
    } else {
      trailDirection.normalize();
    }

    trailSide.set(-trailDirection.z, 0, trailDirection.x);
    if (trailSide.lengthSq() === 0) {
      trailSide.set(1, 0, 0);
    } else {
      trailSide.normalize();
    }

    this.sniffTrail.forEach((puff, index) => {
      const t = (index + 1) / (this.sniffTrail.length + 1);
      const sideOffset =
        Math.sin(t * Math.PI) * SNIFF_CONFIG.trailSideOffset * (index % 2 === 0 ? -1 : 1);

      // Keep the trail readable without drawing a literal straight line to the sock.
      trailPosition.lerpVectors(this.sniffOrigin, target, t);
      trailPosition.addScaledVector(trailSide, sideOffset);
      trailPosition.addScaledVector(UP_VECTOR, Math.sin(t * Math.PI) * SNIFF_CONFIG.trailArcHeight);

      puff.userData.basePosition.copy(trailPosition);
      puff.position.copy(trailPosition);
      puff.scale.setScalar(0.8);
      puff.material.opacity = 0.78;
      puff.visible = true;
    });

    return true;
  }

  resetRound() {
    const spawnPoints = takeRandomItems(SOCK_SPAWN_POINTS, this.totalSocks);
    this.activeIndex = 0;
    this.returnedCount = 0;
    this.carriedSock = null;
    this.clearSniffEffects();

    this.socks.forEach((sock, index) => {
      placeSockAt({
        sock,
        scene: this.scene,
        position: spawnPoints[index],
        rotationY: Math.random() * Math.PI,
      });
      setSockFocus(sock, index === 0);
    });
  }

  tryPickup(dogPosition) {
    if (this.carriedSock) {
      return false;
    }

    const activeSock = this.getActiveSock();
    if (!activeSock) {
      return false;
    }

    if (dogPosition.distanceTo(activeSock.position) >= DOG_CONFIG.pickupDistance) {
      return false;
    }

    this.carriedSock = activeSock;
    this.clearSniffEffects();
    attachSockToDog({ sock: activeSock, dog: this.dog });
    return true;
  }

  tryReturn(dogPosition, tempVector) {
    if (!this.carriedSock) {
      return { returned: false, roundComplete: false, returnedCount: this.returnedCount };
    }

    const ownerPosition = this.owner.getWorldPosition(tempVector);
    if (dogPosition.distanceTo(ownerPosition) >= DOG_CONFIG.returnDistance) {
      return { returned: false, roundComplete: false, returnedCount: this.returnedCount };
    }

    const deliveredSock = this.carriedSock;
    this.carriedSock = null;
    this.clearSniffEffects();

    placeSockByOwner({
      sock: deliveredSock,
      scene: this.scene,
      owner: this.owner,
      deliveryIndex: this.returnedCount,
    });
    setSockDelivered(deliveredSock);

    this.returnedCount += 1;
    this.activeIndex = this.returnedCount;

    const nextSock = this.getActiveSock();
    if (nextSock) {
      setSockFocus(nextSock, true);
    }

    return {
      returned: true,
      roundComplete: this.returnedCount >= this.socks.length,
      returnedCount: this.returnedCount,
    };
  }

  hideMarkers() {
    this.markers.sockMarker.visible = false;
    this.markers.ownerMarker.visible = false;
  }

  updateMarkers({ elapsed, gameStarted }) {
    if (!gameStarted) {
      this.hideMarkers();
      return;
    }

    const bob = Math.sin(elapsed * MARKER_CONFIG.bobSpeed) * MARKER_CONFIG.bobHeight;

    if (this.carriedSock) {
      this.markers.ownerMarker.visible = true;
      this.markers.ownerMarker.position.set(
        this.owner.position.x,
        MARKER_CONFIG.ownerHeight + bob,
        this.owner.position.z,
      );
      this.markers.ownerMarker.rotation.y = elapsed * MARKER_CONFIG.ownerSpinSpeed;
      this.markers.sockMarker.visible = false;
      return;
    }

    const activeSock = this.getActiveSock();
    if (!activeSock) {
      this.hideMarkers();
      return;
    }

    this.markers.sockMarker.visible = true;
    this.markers.sockMarker.position.set(
      activeSock.position.x,
      MARKER_CONFIG.sockHeight + bob,
      activeSock.position.z,
    );
    this.markers.sockMarker.rotation.y = elapsed * MARKER_CONFIG.sockSpinSpeed;
    this.markers.ownerMarker.visible = false;
  }

  updateSniffEffects({ delta, elapsed, gameStarted }) {
    if (!gameStarted) {
      this.clearSniffEffects();
      return;
    }

    if (this.sniffTimer <= 0 || this.carriedSock) {
      return;
    }

    const target = this.getActiveSockWorldPosition(this.sniffTarget);
    if (!target) {
      this.clearSniffEffects();
      return;
    }

    this.sniffTimer = Math.max(0, this.sniffTimer - delta);
    const progress = 1 - this.sniffTimer / SNIFF_CONFIG.effectDurationSeconds;

    this.sniffRings.forEach((ring, index) => {
      const ringProgress = (progress + index * 0.18) % 1;
      ring.visible = true;
      ring.position.set(target.x, target.y + 0.06 + index * 0.02, target.z);
      ring.scale.setScalar(0.8 + ringProgress * 1.55);
      ring.material.opacity = Math.max(0, (1 - ringProgress) * 0.42 * (1 - progress * 0.3));
    });

    this.sniffTrail.forEach((puff, index) => {
      puff.visible = true;
      puff.position.copy(puff.userData.basePosition);
      puff.position.y += progress * 0.42 + Math.sin(elapsed * 4 + puff.userData.phase) * 0.08;
      puff.scale.setScalar(0.78 + progress * 0.18 + Math.sin(elapsed * 5 + index) * 0.05);
      puff.material.opacity = Math.max(0, (1 - progress) * 0.7);
    });

    if (this.sniffTimer === 0) {
      this.clearSniffEffects();
    }
  }
}
