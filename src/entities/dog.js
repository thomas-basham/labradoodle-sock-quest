import * as THREE from "three";

import { DOG_CONFIG, MOVEMENT_CONFIG, PALETTE } from "../game/config";
import { clamp, damp } from "../utils/math";

const upVector = new THREE.Vector3(0, 1, 0);
const moveIntent = new THREE.Vector3();
const facingDirection = new THREE.Vector3();

function makeStandardMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

function getMoveIntent(inputState) {
  moveIntent.set(inputState.moveX, 0, inputState.moveY);

  if (inputState.forward) moveIntent.z -= 1;
  if (inputState.backward) moveIntent.z += 1;
  if (inputState.left) moveIntent.x -= 1;
  if (inputState.right) moveIntent.x += 1;

  if (moveIntent.lengthSq() > 0) {
    moveIntent.normalize();
  }

  return moveIntent;
}

function animateDog(dog, dogState, delta) {
  const moving = dogState.speed > DOG_CONFIG.activeSpeedThreshold;
  dogState.animationTime += delta * (moving ? DOG_CONFIG.moveAnimationSpeed : DOG_CONFIG.idleAnimationSpeed);

  const bounce = moving ? Math.abs(Math.sin(dogState.animationTime * 2)) * DOG_CONFIG.bounceHeight : 0;
  dog.position.y = bounce;

  dog.userData.head.rotation.z = moving ? Math.sin(dogState.animationTime * 2) * 0.04 : 0;
  dog.userData.tail.rotation.y = Math.sin(dogState.animationTime * 2.8) * 0.45;
  dog.userData.leftEar.rotation.x = moving ? Math.sin(dogState.animationTime * 1.5) * 0.08 : 0.03;
  dog.userData.rightEar.rotation.x = moving ? -Math.sin(dogState.animationTime * 1.5) * 0.08 : -0.03;

  const legPhase = [0, Math.PI, Math.PI, 0];
  dog.userData.legs.forEach((leg, index) => {
    const stride = moving ? Math.sin(dogState.animationTime * 1.75 + legPhase[index]) * 0.45 : 0;
    leg.rotation.z = stride;
    dog.userData.paws[index].position.y = 0.28 + Math.max(0, -stride) * 0.08;
  });
}

export function createDog(scene) {
  const dog = new THREE.Group();
  const fur = makeStandardMaterial(PALETTE.fur, 0.98);
  const furDark = makeStandardMaterial(PALETTE.furDark, 0.95);
  const furLight = makeStandardMaterial(PALETTE.furLight, 0.93);
  const noseMaterial = makeStandardMaterial(0x2a2420, 0.5);
  const tongueMaterial = makeStandardMaterial(0xf78e96, 0.72);

  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.28, 18, 18), fur);
  torso.scale.set(1.6, 1.08, 1.1);
  torso.position.set(0, 1.82, 0);
  torso.castShadow = true;
  dog.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 14), furLight);
  chest.scale.set(1.05, 1.12, 0.86);
  chest.position.set(1.18, 1.62, 0);
  chest.castShadow = true;
  dog.add(chest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 12), fur);
  neck.rotation.z = -0.48;
  neck.position.set(1.52, 2.26, 0);
  neck.castShadow = true;
  dog.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.86, 18, 18), fur);
  head.scale.set(1.12, 1.03, 0.98);
  head.position.set(2.15, 2.62, 0);
  head.castShadow = true;
  dog.add(head);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 14), furLight);
  muzzle.scale.set(1.28, 0.8, 0.74);
  muzzle.position.set(2.82, 2.35, 0);
  muzzle.castShadow = true;
  dog.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), noseMaterial);
  nose.position.set(3.28, 2.32, 0);
  dog.add(nose);

  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.34), tongueMaterial);
  tongue.position.set(3.02, 2.05, 0);
  tongue.rotation.z = -0.2;
  dog.add(tongue);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.11, 12, 20),
    makeStandardMaterial(PALETTE.collar, 0.6),
  );
  collar.position.set(1.7, 2.34, 0);
  collar.rotation.y = Math.PI / 2;
  dog.add(collar);

  const tag = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    makeStandardMaterial(0xf7c94a, 0.55),
  );
  tag.position.set(1.97, 2.05, 0.18);
  tag.castShadow = true;
  dog.add(tag);

  const earGeometry = new THREE.SphereGeometry(0.38, 14, 14);
  const leftEar = new THREE.Mesh(earGeometry, furDark);
  const rightEar = leftEar.clone();
  leftEar.position.set(1.95, 2.7, 0.7);
  rightEar.position.set(1.95, 2.7, -0.7);
  leftEar.scale.set(0.7, 1.25, 0.46);
  rightEar.scale.copy(leftEar.scale);
  dog.add(leftEar, rightEar);

  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.15, 4, 8), furDark);
  tail.position.set(-1.95, 2.05, 0);
  tail.rotation.z = 1.0;
  tail.rotation.x = 0.28;
  tail.castShadow = true;
  dog.add(tail);

  const legGeometry = new THREE.CapsuleGeometry(0.22, 1.1, 5, 10);
  const pawGeometry = new THREE.SphereGeometry(0.22, 12, 12);
  const legOffsets = [
    [1.0, 0.82, 0.66],
    [1.0, 0.82, -0.66],
    [-0.86, 0.88, 0.72],
    [-0.86, 0.88, -0.72],
  ];

  const legs = [];
  const paws = [];
  for (const [x, y, z] of legOffsets) {
    const leg = new THREE.Mesh(legGeometry, fur);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    dog.add(leg);
    legs.push(leg);

    const paw = new THREE.Mesh(pawGeometry, furLight);
    paw.position.set(x, 0.28, z);
    paw.castShadow = true;
    dog.add(paw);
    paws.push(paw);
  }

  const fluffOffsets = [
    [-0.9, 2.35, 0.65, 0.42],
    [-0.4, 2.62, -0.82, 0.45],
    [0.28, 2.76, 0.8, 0.38],
    [0.64, 2.2, -0.86, 0.34],
    [-1.18, 1.58, -0.7, 0.35],
    [0.0, 1.36, 0.98, 0.32],
  ];

  for (const [x, y, z, size] of fluffOffsets) {
    const fluff = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), fur);
    fluff.position.set(x, y, z);
    fluff.castShadow = true;
    dog.add(fluff);
  }

  dog.position.set(...DOG_CONFIG.spawn);
  dog.rotation.y = Math.PI;
  dog.userData = {
    head,
    tail,
    leftEar,
    rightEar,
    legs,
    paws,
  };

  scene.add(dog);
  return dog;
}

export function resetDog(dog, dogState) {
  dog.position.set(...DOG_CONFIG.spawn);
  dog.rotation.y = Math.PI;

  dogState.position.copy(dog.position);
  dogState.yaw = dog.rotation.y;
  dogState.speed = 0;
  dogState.velocity.set(0, 0, 0);
  dogState.hasSock = false;
  dogState.animationTime = 0;
}

export function updateDog({ dog, dogState, inputState, pointerState, worldState, delta }) {
  if (!worldState.gameStarted) {
    dogState.speed = 0;
    animateDog(dog, dogState, delta);
    return;
  }

  const desiredMove = getMoveIntent(inputState);

  if (desiredMove.lengthSq() > 0) {
    const moveAngle = Math.atan2(desiredMove.x, desiredMove.z);
    const targetYaw = pointerState.yaw + moveAngle + Math.PI;
    dogState.yaw = damp(dogState.yaw, targetYaw, MOVEMENT_CONFIG.yawDamping, delta);
  }

  const speedTarget =
    desiredMove.lengthSq() > 0
      ? inputState.sprint
        ? MOVEMENT_CONFIG.sprintSpeed
        : MOVEMENT_CONFIG.walkSpeed
      : 0;

  dogState.speed = damp(dogState.speed, speedTarget, MOVEMENT_CONFIG.speedDamping, delta);

  facingDirection.set(0, 0, -1).applyAxisAngle(upVector, dogState.yaw);
  dogState.velocity.copy(facingDirection).multiplyScalar(dogState.speed * delta);
  dogState.position.add(dogState.velocity);

  dogState.position.x = clamp(
    dogState.position.x,
    MOVEMENT_CONFIG.bounds.x[0],
    MOVEMENT_CONFIG.bounds.x[1],
  );
  dogState.position.z = clamp(
    dogState.position.z,
    MOVEMENT_CONFIG.bounds.z[0],
    MOVEMENT_CONFIG.bounds.z[1],
  );

  dog.position.x = dogState.position.x;
  dog.position.z = dogState.position.z;
  dog.rotation.y = dogState.yaw;

  animateDog(dog, dogState, delta);
}
