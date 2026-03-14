import * as THREE from "three";

import { CAMERA_CONFIG } from "../game/config";
import { damp, dampingFactor } from "../utils/math";

const upVector = new THREE.Vector3(0, 1, 0);
const xAxis = new THREE.Vector3(1, 0, 0);
const targetOffset = new THREE.Vector3(...CAMERA_CONFIG.targetOffset);
const followOffset = new THREE.Vector3(...CAMERA_CONFIG.followOffset);
const focusTarget = new THREE.Vector3();
const desiredPosition = new THREE.Vector3();
const rotatedOffset = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const lookAheadTarget = new THREE.Vector3();
const lookAheadForward = new THREE.Vector3();

export function createFollowCamera() {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.fov,
    window.innerWidth / window.innerHeight,
    CAMERA_CONFIG.near,
    CAMERA_CONFIG.far,
  );

  camera.position.set(...CAMERA_CONFIG.initialPosition);
  camera.userData.bobWeight = 0;
  camera.userData.lookAhead = new THREE.Vector3();
  return camera;
}

export function resizeFollowCamera(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

export function updateFollowCamera({
  camera,
  target,
  pointerState,
  delta,
  elapsed = 0,
  dogYaw = pointerState.yaw,
  movementIntensity = 0,
  sprinting = false,
}) {
  const targetBobWeight = movementIntensity > 0.08 ? movementIntensity : 0;
  camera.userData.bobWeight = damp(
    camera.userData.bobWeight ?? 0,
    targetBobWeight,
    CAMERA_CONFIG.bobDamping,
    delta,
  );
  const bobPhase = elapsed * CAMERA_CONFIG.bobSpeed * (sprinting ? 1.18 : 1);
  const verticalBob = Math.abs(Math.sin(bobPhase)) * CAMERA_CONFIG.bobHeight * camera.userData.bobWeight;
  const lateralBob = Math.sin(bobPhase * 0.5) * CAMERA_CONFIG.bobSway * camera.userData.bobWeight;
  const lookAhead = camera.userData.lookAhead ?? new THREE.Vector3();

  // A small forward lead makes fast turns feel less draggy without pulling the camera off target.
  lookAheadForward.set(0, 0, -1).applyAxisAngle(upVector, dogYaw);
  lookAheadTarget
    .copy(lookAheadForward)
    .multiplyScalar(CAMERA_CONFIG.lookAheadDistance * movementIntensity);
  lookAheadTarget.y = CAMERA_CONFIG.lookAheadLift * movementIntensity;
  lookAhead.lerp(lookAheadTarget, dampingFactor(CAMERA_CONFIG.lookAheadDamping, delta));
  camera.userData.lookAhead = lookAhead;

  focusTarget.copy(target).add(targetOffset).add(lookAhead);
  rotatedOffset.copy(followOffset);
  rotatedOffset.applyAxisAngle(xAxis, pointerState.pitch);
  rotatedOffset.applyAxisAngle(upVector, pointerState.yaw);

  desiredPosition.copy(focusTarget).add(rotatedOffset);
  desiredPosition.y += verticalBob;
  focusTarget.y += verticalBob * 0.3;

  cameraRight.copy(rotatedOffset).cross(upVector);
  if (cameraRight.lengthSq() > 0) {
    cameraRight.normalize();
    desiredPosition.addScaledVector(cameraRight, lateralBob);
  }

  camera.position.lerp(desiredPosition, dampingFactor(CAMERA_CONFIG.followDamping, delta));
  camera.lookAt(focusTarget);
}
