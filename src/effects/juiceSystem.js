import * as THREE from "three";

import { JUICE_CONFIG, PALETTE } from "../game/config";

const upVector = new THREE.Vector3(0, 1, 0);
const backVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();
const spawnPosition = new THREE.Vector3();
const driftVelocity = new THREE.Vector3();

function createPickupRing(scene) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.42, 24),
    new THREE.MeshBasicMaterial({
      color: PALETTE.sockStripe,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);
  return ring;
}

function createPickupBurstParticle(scene, index) {
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    new THREE.MeshBasicMaterial({
      color: index % 2 === 0 ? PALETTE.scentGlow : PALETTE.sockStripe,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  particle.visible = false;
  particle.userData.velocity = new THREE.Vector3();
  particle.userData.active = false;
  particle.userData.age = 0;
  scene.add(particle);
  return particle;
}

function createDustParticle(scene) {
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xe7c997,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  particle.visible = false;
  particle.userData.velocity = new THREE.Vector3();
  particle.userData.active = false;
  particle.userData.age = 0;
  scene.add(particle);
  return particle;
}

export class JuiceSystem {
  constructor({ scene, dog }) {
    this.scene = scene;
    this.dog = dog;
    this.pickupRing = createPickupRing(scene);
    this.pickupBurstAge = 0;
    this.pickupBurstActive = false;
    this.pickupParticles = Array.from(
      { length: JUICE_CONFIG.pickupBurstCount },
      (_, index) => createPickupBurstParticle(scene, index),
    );
    this.dustParticles = Array.from({ length: JUICE_CONFIG.sprintDustCount }, () =>
      createDustParticle(scene),
    );
    this.dustSpawnTimer = 0;
    this.dustSide = 1;
  }

  reset() {
    this.pickupBurstAge = 0;
    this.pickupBurstActive = false;
    this.pickupRing.visible = false;
    this.pickupRing.material.opacity = 0;
    this.dustSpawnTimer = 0;

    this.pickupParticles.forEach((particle) => {
      particle.visible = false;
      particle.userData.active = false;
      particle.material.opacity = 0;
    });
    this.dustParticles.forEach((particle) => {
      particle.visible = false;
      particle.userData.active = false;
      particle.material.opacity = 0;
    });
  }

  destroy() {
    this.reset();
  }

  spawnPickupBurst(position) {
    this.pickupBurstActive = true;
    this.pickupBurstAge = 0;
    this.pickupRing.visible = true;
    this.pickupRing.position.set(position.x, position.y + 0.06, position.z);
    this.pickupRing.scale.setScalar(1);
    this.pickupRing.material.opacity = 0.52;

    this.pickupParticles.forEach((particle, index) => {
      const angle = (index / this.pickupParticles.length) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.18;
      particle.visible = true;
      particle.userData.active = true;
      particle.userData.age = 0;
      particle.position.set(
        position.x + Math.cos(angle) * 0.24,
        position.y + 0.28 + Math.random() * 0.14,
        position.z + Math.sin(angle) * 0.24,
      );
      particle.scale.setScalar(0.9 + Math.random() * 0.25);
      particle.userData.velocity.set(
        Math.cos(angle) * radius * 2.6,
        0.8 + Math.random() * 0.5,
        Math.sin(angle) * radius * 2.6,
      );
      particle.material.opacity = 0.82;
    });
  }

  update({ delta, dogState, inputState, gameStarted }) {
    this.updatePickupBurst(delta);
    this.updateDust(delta);

    if (!gameStarted) {
      return;
    }

    const shouldSpawnDust =
      inputState.sprint && dogState.speed >= JUICE_CONFIG.sprintThreshold;
    if (!shouldSpawnDust) {
      this.dustSpawnTimer = 0;
      return;
    }

    this.dustSpawnTimer -= delta;
    if (this.dustSpawnTimer > 0) {
      return;
    }

    this.spawnDust();
    this.dustSpawnTimer = JUICE_CONFIG.sprintDustSpawnInterval;
  }

  updatePickupBurst(delta) {
    if (!this.pickupBurstActive) {
      return;
    }

    this.pickupBurstAge += delta;
    const progress = Math.min(1, this.pickupBurstAge / JUICE_CONFIG.pickupBurstDuration);
    this.pickupRing.visible = true;
    this.pickupRing.scale.setScalar(1 + progress * 2.8);
    this.pickupRing.material.opacity = Math.max(0, (1 - progress) * 0.52);

    this.pickupParticles.forEach((particle) => {
      if (!particle.userData.active) {
        return;
      }

      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.y += 1.2 * delta;
      particle.scale.multiplyScalar(0.992);
      particle.material.opacity = Math.max(0, (1 - progress) * 0.84);
    });

    if (progress >= 1) {
      this.pickupBurstActive = false;
      this.pickupRing.visible = false;
      this.pickupRing.material.opacity = 0;
      this.pickupParticles.forEach((particle) => {
        particle.visible = false;
        particle.userData.active = false;
        particle.material.opacity = 0;
      });
    }
  }

  spawnDust() {
    const particle = this.dustParticles.find((candidate) => !candidate.userData.active);
    if (!particle) {
      return;
    }

    backVector.set(0, 0, 1).applyQuaternion(this.dog.quaternion).normalize();
    sideVector.set(1, 0, 0).applyQuaternion(this.dog.quaternion).normalize();
    this.dustSide *= -1;

    spawnPosition.copy(this.dog.position);
    spawnPosition.y = 0.16;
    spawnPosition.addScaledVector(backVector, 0.7);
    spawnPosition.addScaledVector(sideVector, 0.4 * this.dustSide);

    particle.userData.active = true;
    particle.userData.age = 0;
    particle.position.copy(spawnPosition);
    particle.scale.setScalar(0.82 + Math.random() * 0.22);
    driftVelocity.copy(backVector).multiplyScalar(1.2 + Math.random() * 0.5);
    driftVelocity.addScaledVector(sideVector, -0.35 * this.dustSide);
    driftVelocity.addScaledVector(upVector, 0.6 + Math.random() * 0.25);
    particle.userData.velocity.copy(driftVelocity);
    particle.material.opacity = 0.28;
    particle.visible = true;
  }

  updateDust(delta) {
    this.dustParticles.forEach((particle) => {
      if (!particle.userData.active) {
        return;
      }

      particle.userData.age += delta;
      const progress = particle.userData.age / JUICE_CONFIG.sprintDustDuration;
      if (progress >= 1) {
        particle.userData.active = false;
        particle.visible = false;
        particle.material.opacity = 0;
        return;
      }

      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.multiplyScalar(0.94);
      particle.material.opacity = Math.max(0, (1 - progress) * 0.28);
      particle.scale.multiplyScalar(1.004);
    });
  }
}
