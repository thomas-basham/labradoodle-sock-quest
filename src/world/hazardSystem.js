import * as THREE from "three";

import { HAZARD_CONFIG, PALETTE } from "../game/config";
import { damp, takeRandomItems } from "../utils/math";

const DEFAULT_MUD_CANDIDATES = [
  { x: -16, z: -13, radius: 2.5 },
  { x: -3, z: -11, radius: 2.3 },
  { x: 8, z: 3, radius: 2.2 },
  { x: 15, z: 11, radius: 2.4 },
];

const DEFAULT_TOY_CANDIDATES = [
  { x: -15, z: 6, radius: 1.7 },
  { x: 11, z: -10, radius: 1.7 },
  { x: 2, z: 11, radius: 1.7 },
  { x: 17, z: 2, radius: 1.7 },
];

const DEFAULT_SPRINKLER_CANDIDATES = [
  { x: 0, z: 0, radius: 3.4 },
  { x: -8, z: -1, radius: 3.2 },
  { x: 9, z: 1, radius: 3.2 },
];

const DEFAULT_GARDEN_CANDIDATES = [
  { x: -18, z: 14, halfWidth: 2.6, halfDepth: 1.35 },
  { x: 18, z: 14, halfWidth: 2.8, halfDepth: 1.35 },
  { x: -20, z: -6, halfWidth: 2.2, halfDepth: 1.45 },
  { x: 20, z: -8, halfWidth: 2.4, halfDepth: 1.45 },
];

const GARDEN_FLOWER_COLORS = [0xffcf71, 0xff88a9, 0xffffff, 0xffa64f];
const TOY_COLORS = [PALETTE.toyRed, PALETTE.toyBlue, PALETTE.toyYellow];
const PARTICLE_POOL_SIZE = 28;
const STATUS_EVENT_DURATION = 1.5;
const RESERVED_MARGIN = 1.1;

const correctionVector = new THREE.Vector3();
const impulseVector = new THREE.Vector3();

function makeStandardMaterial(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
  });
}

function createDisc(radius, color, opacity = 1) {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshStandardMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      roughness: 0.98,
      metalness: 0,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function distanceSq2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function movementSq2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function candidateClearance(candidate) {
  if ("radius" in candidate) {
    return candidate.radius + RESERVED_MARGIN;
  }

  return Math.max(candidate.halfWidth, candidate.halfDepth) + RESERVED_MARGIN;
}

function isCandidateClear(candidate, reservedPositions) {
  const minDistanceSq = candidateClearance(candidate) * candidateClearance(candidate);
  return reservedPositions.every((reserved) => distanceSq2D(candidate, reserved) > minDistanceSq);
}

function pickCandidates(candidates, count, reservedPositions) {
  const shuffled = takeRandomItems(candidates, candidates.length);
  const selected = shuffled.filter((candidate) => isCandidateClear(candidate, reservedPositions)).slice(0, count);

  if (selected.length === count) {
    return selected;
  }

  const used = new Set(selected);
  for (const candidate of shuffled) {
    if (used.has(candidate)) {
      continue;
    }

    selected.push(candidate);
    used.add(candidate);
    if (selected.length === count) {
      break;
    }
  }

  return selected;
}

function pointInCircle(position, hazard) {
  return distanceSq2D(position, hazard.center) <= hazard.radius * hazard.radius;
}

function pointInGarden(position, hazard) {
  return (
    Math.abs(position.x - hazard.center.x) <= hazard.halfWidth &&
    Math.abs(position.z - hazard.center.z) <= hazard.halfDepth
  );
}

function disposeObject(root) {
  root.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (!child.material) {
      return;
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function createMudHazard(candidate) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(candidate.radius, 28),
    new THREE.MeshStandardMaterial({
      color: PALETTE.mud,
      roughness: 0.98,
      metalness: 0,
    }),
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.03;
  base.receiveShadow = true;
  group.add(base);

  for (let index = 0; index < 3; index += 1) {
    const splash = createDisc(0.45 + index * 0.2, index === 1 ? PALETTE.mudHighlight : PALETTE.mud, 0.92);
    splash.position.set(
      (Math.random() - 0.5) * candidate.radius * 0.9,
      0.034 + index * 0.002,
      (Math.random() - 0.5) * candidate.radius * 0.7,
    );
    splash.scale.x = 1.1 + Math.random() * 0.4;
    splash.scale.y = 0.8 + Math.random() * 0.25;
    group.add(splash);
  }

  group.position.set(candidate.x, 0, candidate.z);
  return {
    type: "mud",
    center: new THREE.Vector3(candidate.x, 0, candidate.z),
    radius: candidate.radius,
    root: group,
    nextSplashAt: 0,
  };
}

function createToyPile(candidate) {
  const group = new THREE.Group();
  const rug = createDisc(candidate.radius + 0.22, 0xf6d9a6, 0.92);
  rug.position.y = 0.032;
  group.add(rug);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 14, 14),
    makeStandardMaterial(PALETTE.toyRed, 0.6),
  );
  ball.position.set(-0.34, 0.3, 0.18);
  ball.castShadow = true;

  const squeaker = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.11, 12, 18),
    makeStandardMaterial(PALETTE.toyBlue, 0.62),
  );
  squeaker.rotation.x = Math.PI / 2;
  squeaker.position.set(0.26, 0.18, -0.18);
  squeaker.castShadow = true;

  const nub = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.12, 0.38, 4, 8),
    makeStandardMaterial(PALETTE.toyYellow, 0.64),
  );
  nub.rotation.z = 0.68;
  nub.position.set(0.05, 0.26, 0.36);
  nub.castShadow = true;

  group.add(ball, squeaker, nub);
  group.position.set(candidate.x, 0, candidate.z);

  return {
    type: "toyPile",
    center: new THREE.Vector3(candidate.x, 0, candidate.z),
    radius: candidate.radius,
    root: group,
    nextTriggerAt: 0,
  };
}

function createSprinkler(candidate) {
  const group = new THREE.Group();

  const zone = createDisc(candidate.radius, PALETTE.sprinklerGlow, 0.18);
  zone.position.y = 0.028;
  group.add(zone);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.22, 14),
    makeStandardMaterial(PALETTE.sprinkler, 0.52),
  );
  base.position.y = 0.12;
  base.castShadow = true;

  const rotor = new THREE.Group();
  for (const z of [-0.26, 0.26]) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.06, 0.08),
      makeStandardMaterial(0xe3eef5, 0.44),
    );
    arm.position.set(0, 0.3, z * 0.35);
    arm.castShadow = true;
    rotor.add(arm);
  }

  const riser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.32, 10),
    makeStandardMaterial(0xd7e8f2, 0.4),
  );
  riser.position.y = 0.26;
  riser.castShadow = true;

  group.add(base, riser, rotor);
  group.position.set(candidate.x, 0, candidate.z);

  return {
    type: "sprinkler",
    center: new THREE.Vector3(candidate.x, 0, candidate.z),
    radius: candidate.radius,
    root: group,
    rotor,
    nextMistAt: 0,
  };
}

function createFlower(group, x, z, size, color) {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.46, 6),
    makeStandardMaterial(PALETTE.gardenLeaf, 0.9),
  );
  stem.position.set(x, 0.23, z);
  stem.castShadow = true;

  const blossom = new THREE.Mesh(
    new THREE.SphereGeometry(size, 10, 10),
    makeStandardMaterial(color, 0.56),
  );
  blossom.position.set(x, 0.5, z);
  blossom.castShadow = true;

  group.add(stem, blossom);
}

function createGardenBed(candidate) {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(candidate.halfWidth * 2, 0.28, candidate.halfDepth * 2),
    makeStandardMaterial(PALETTE.gardenBorder, 0.9),
  );
  outer.position.y = 0.14;
  outer.receiveShadow = true;
  outer.castShadow = true;

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(candidate.halfWidth * 2 - 0.28, 0.1, candidate.halfDepth * 2 - 0.28),
    makeStandardMaterial(PALETTE.gardenSoil, 0.98),
  );
  soil.position.y = 0.22;
  soil.receiveShadow = true;

  group.add(outer, soil);

  for (let index = 0; index < 7; index += 1) {
    createFlower(
      group,
      (Math.random() - 0.5) * (candidate.halfWidth * 1.5),
      (Math.random() - 0.5) * (candidate.halfDepth * 1.4),
      0.11 + Math.random() * 0.03,
      GARDEN_FLOWER_COLORS[index % GARDEN_FLOWER_COLORS.length],
    );
  }

  group.position.set(candidate.x, 0, candidate.z);

  return {
    type: "gardenBed",
    center: new THREE.Vector3(candidate.x, 0, candidate.z),
    halfWidth: candidate.halfWidth,
    halfDepth: candidate.halfDepth,
    root: group,
  };
}

function createFeedbackParticle(group) {
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({
      color: PALETTE.sprinklerGlow,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  particle.visible = false;
  particle.userData.velocity = new THREE.Vector3();
  particle.userData.life = 0;
  particle.userData.duration = 0;
  particle.userData.baseSize = 0.1;
  group.add(particle);
  return particle;
}

export class HazardSystem {
  constructor({ scene }) {
    this.scene = scene;
    this.layoutGroup = new THREE.Group();
    this.layoutGroup.name = "hazards";
    this.effectGroup = new THREE.Group();
    this.effectGroup.name = "hazard-effects";
    this.scene.add(this.layoutGroup, this.effectGroup);

    this.hazards = [];
    this.particles = Array.from({ length: PARTICLE_POOL_SIZE }, () => createFeedbackParticle(this.effectGroup));
    this.eventStatus = { ...HAZARD_CONFIG.defaultStatus };
    this.eventTimer = 0;
    this.nextGardenCalloutAt = 0;
    this.sprinklerOverlay = 0;
  }

  clearLayout() {
    this.layoutGroup.children.forEach((child) => disposeObject(child));
    this.layoutGroup.clear();
    this.hazards = [];
  }

  clearParticles() {
    this.particles.forEach((particle) => {
      particle.visible = false;
      particle.material.opacity = 0;
      particle.userData.life = 0;
    });
  }

  resetRound({ reservedPositions = [], levelHazards = {} }) {
    this.clearLayout();
    this.clearParticles();
    this.eventStatus = { ...HAZARD_CONFIG.defaultStatus };
    this.eventTimer = 0;
    this.nextGardenCalloutAt = 0;
    this.sprinklerOverlay = 0;

    const counts = levelHazards.counts ?? {};
    const candidates = levelHazards.candidates ?? {};

    const mudCandidates = pickCandidates(
      candidates.mud ?? DEFAULT_MUD_CANDIDATES,
      counts.mud ?? HAZARD_CONFIG.mud.count,
      reservedPositions,
    ).map((candidate) => createMudHazard(candidate));
    const toyCandidates = pickCandidates(
      candidates.toyPile ?? DEFAULT_TOY_CANDIDATES,
      counts.toyPile ?? HAZARD_CONFIG.toyPile.count,
      reservedPositions,
    ).map((candidate) => createToyPile(candidate));
    const sprinklerCandidates = pickCandidates(
      candidates.sprinkler ?? DEFAULT_SPRINKLER_CANDIDATES,
      counts.sprinkler ?? HAZARD_CONFIG.sprinkler.count,
      reservedPositions,
    ).map((candidate) => createSprinkler(candidate));
    const gardenCandidates = pickCandidates(
      candidates.gardenBed ?? DEFAULT_GARDEN_CANDIDATES,
      counts.gardenBed ?? HAZARD_CONFIG.gardenBed.count,
      reservedPositions,
    ).map((candidate) => createGardenBed(candidate));

    this.hazards = [
      ...mudCandidates,
      ...toyCandidates,
      ...sprinklerCandidates,
      ...gardenCandidates,
    ];

    this.hazards.forEach((hazard) => this.layoutGroup.add(hazard.root));
  }

  shiftTimers(offsetMs) {
    if (offsetMs <= 0) {
      return;
    }

    if (this.nextGardenCalloutAt > 0) {
      this.nextGardenCalloutAt += offsetMs;
    }

    this.hazards.forEach((hazard) => {
      if ("nextSplashAt" in hazard && hazard.nextSplashAt > 0) {
        hazard.nextSplashAt += offsetMs;
      }

      if ("nextTriggerAt" in hazard && hazard.nextTriggerAt > 0) {
        hazard.nextTriggerAt += offsetMs;
      }

      if ("nextMistAt" in hazard && hazard.nextMistAt > 0) {
        hazard.nextMistAt += offsetMs;
      }
    });
  }

  getDefaultStatus() {
    return {
      ...HAZARD_CONFIG.defaultStatus,
      sprinklerOverlay: 0,
      impulse: null,
    };
  }

  setEventStatus(status) {
    this.eventStatus = { ...status };
    this.eventTimer = STATUS_EVENT_DURATION;
  }

  getSpeedMultiplier(position) {
    for (const hazard of this.hazards) {
      if (hazard.type === "mud" && pointInCircle(position, hazard)) {
        return HAZARD_CONFIG.mud.slowMultiplier;
      }
    }

    return 1;
  }

  resolveMovement({ currentPosition, proposedPosition, now }) {
    correctionVector.copy(proposedPosition);
    let blocked = false;

    for (const hazard of this.hazards) {
      if (hazard.type !== "gardenBed" || !pointInGarden(correctionVector, hazard)) {
        continue;
      }

      blocked = true;
      const deltaX = correctionVector.x - hazard.center.x;
      const deltaZ = correctionVector.z - hazard.center.z;
      const overlapX = hazard.halfWidth - Math.abs(deltaX);
      const overlapZ = hazard.halfDepth - Math.abs(deltaZ);

      if (overlapX < overlapZ) {
        const direction = deltaX === 0 ? Math.sign(currentPosition.x - hazard.center.x) || 1 : Math.sign(deltaX);
        correctionVector.x =
          hazard.center.x +
          direction * (hazard.halfWidth + HAZARD_CONFIG.gardenBed.collisionPadding);
      } else {
        const direction = deltaZ === 0 ? Math.sign(currentPosition.z - hazard.center.z) || 1 : Math.sign(deltaZ);
        correctionVector.z =
          hazard.center.z +
          direction * (hazard.halfDepth + HAZARD_CONFIG.gardenBed.collisionPadding);
      }
    }

    if (blocked && now >= this.nextGardenCalloutAt) {
      this.setEventStatus({
        badge: HAZARD_CONFIG.gardenBed.badge,
        title: HAZARD_CONFIG.gardenBed.title,
        detail: HAZARD_CONFIG.gardenBed.detail,
      });
      this.nextGardenCalloutAt = now + HAZARD_CONFIG.gardenBed.calloutCooldownMs;
    }

    return correctionVector;
  }

  emitParticle({ position, color, spread = 0.24, upward = 0.8, size = 0.11, duration = 0.44 }) {
    const particle = this.particles.find((item) => item.userData.life <= 0) ?? this.particles[0];
    particle.visible = true;
    particle.position.copy(position);
    particle.position.y += 0.18;
    particle.userData.baseSize = size;
    particle.scale.setScalar(size);
    particle.material.color.setHex(color);
    particle.material.opacity = 0.9;
    particle.userData.life = duration;
    particle.userData.duration = duration;
    particle.userData.velocity.set(
      (Math.random() - 0.5) * spread,
      upward + Math.random() * 0.55,
      (Math.random() - 0.5) * spread,
    );
  }

  emitBurst({ position, color, count, spread, upward, size, duration }) {
    for (let index = 0; index < count; index += 1) {
      this.emitParticle({ position, color, spread, upward, size, duration });
    }
  }

  updateParticles(delta) {
    this.particles.forEach((particle) => {
      if (particle.userData.life <= 0) {
        return;
      }

      particle.userData.life = Math.max(0, particle.userData.life - delta);
      particle.position.addScaledVector(particle.userData.velocity, delta);
      particle.userData.velocity.y -= 2.1 * delta;
      particle.material.opacity = (particle.userData.life / particle.userData.duration) * 0.9;
      const scale = 0.65 + particle.userData.life / particle.userData.duration;
      particle.scale.setScalar(scale * particle.userData.baseSize);

      if (particle.userData.life === 0) {
        particle.visible = false;
        particle.material.opacity = 0;
      }
    });
  }

  update({ dogPosition, previousDogPosition, delta, elapsed, now, gameStarted }) {
    if (!gameStarted) {
      this.eventTimer = Math.max(0, this.eventTimer - delta);
      this.sprinklerOverlay = damp(this.sprinklerOverlay, 0, 8, delta);
      this.updateParticles(delta);
      return {
        ...HAZARD_CONFIG.defaultStatus,
        sprinklerOverlay: this.sprinklerOverlay,
        impulse: null,
      };
    }

    let status = null;
    let impulse = null;
    let inSprinkler = false;
    const movedEnoughForSplash = movementSq2D(dogPosition, previousDogPosition) > 0.0009;

    this.hazards.forEach((hazard) => {
      if (hazard.type === "sprinkler") {
        hazard.rotor.rotation.y = elapsed * 3.8;
      }
    });

    for (const hazard of this.hazards) {
      if (hazard.type === "mud" && pointInCircle(dogPosition, hazard)) {
        status = {
          badge: HAZARD_CONFIG.mud.badge,
          title: HAZARD_CONFIG.mud.title,
          detail: HAZARD_CONFIG.mud.detail,
        };

        if (movedEnoughForSplash && now >= hazard.nextSplashAt) {
          this.emitBurst({
            position: dogPosition,
            color: PALETTE.mudHighlight,
            count: 4,
            spread: 0.48,
            upward: 0.9,
            size: 0.12,
            duration: 0.42,
          });
          hazard.nextSplashAt = now + HAZARD_CONFIG.mud.splashIntervalMs;
        }
      }

      if (hazard.type === "toyPile" && pointInCircle(dogPosition, hazard) && now >= hazard.nextTriggerAt) {
        hazard.nextTriggerAt = now + HAZARD_CONFIG.toyPile.triggerCooldownMs;
        impulseVector
          .set(dogPosition.x - hazard.center.x, 0, dogPosition.z - hazard.center.z)
          .normalize();

        if (!Number.isFinite(impulseVector.x) || !Number.isFinite(impulseVector.z)) {
          impulseVector.set(1, 0, 0);
        }

        impulse = impulseVector.clone().multiplyScalar(HAZARD_CONFIG.toyPile.nudgeStrength);
        this.setEventStatus({
          badge: HAZARD_CONFIG.toyPile.badge,
          title: HAZARD_CONFIG.toyPile.title,
          detail: HAZARD_CONFIG.toyPile.detail,
        });

        for (let index = 0; index < 5; index += 1) {
          this.emitParticle({
            position: hazard.center,
            color: TOY_COLORS[index % TOY_COLORS.length],
            spread: 0.72,
            upward: 1.05,
            size: 0.13,
            duration: 0.5,
          });
        }
      }

      if (hazard.type === "sprinkler" && pointInCircle(dogPosition, hazard)) {
        inSprinkler = true;
        status = {
          badge: HAZARD_CONFIG.sprinkler.badge,
          title: HAZARD_CONFIG.sprinkler.title,
          detail: HAZARD_CONFIG.sprinkler.detail,
        };

        if (now >= hazard.nextMistAt) {
          this.emitBurst({
            position: dogPosition,
            color: PALETTE.sprinklerGlow,
            count: 2,
            spread: 0.34,
            upward: 0.75,
            size: 0.1,
            duration: 0.38,
          });
          hazard.nextMistAt = now + HAZARD_CONFIG.sprinkler.mistIntervalMs;
        }
      }
    }

    this.eventTimer = Math.max(0, this.eventTimer - delta);
    this.sprinklerOverlay = damp(
      this.sprinklerOverlay,
      inSprinkler ? HAZARD_CONFIG.sprinkler.overlayOpacity : 0,
      7.5,
      delta,
    );
    this.updateParticles(delta);

    return {
      ...(status ?? (this.eventTimer > 0 ? this.eventStatus : HAZARD_CONFIG.defaultStatus)),
      sprinklerOverlay: this.sprinklerOverlay,
      impulse,
    };
  }
}
