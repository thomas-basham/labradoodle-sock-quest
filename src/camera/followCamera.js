import * as THREE from "three";

import { CAMERA_CONFIG } from "../game/config";
import { dampingFactor } from "../utils/math";

const upVector = new THREE.Vector3(0, 1, 0);
const xAxis = new THREE.Vector3(1, 0, 0);
const targetOffset = new THREE.Vector3(...CAMERA_CONFIG.targetOffset);
const followOffset = new THREE.Vector3(...CAMERA_CONFIG.followOffset);
const focusTarget = new THREE.Vector3();
const desiredPosition = new THREE.Vector3();
const rotatedOffset = new THREE.Vector3();

export function createFollowCamera() {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.fov,
    window.innerWidth / window.innerHeight,
    CAMERA_CONFIG.near,
    CAMERA_CONFIG.far,
  );

  camera.position.set(...CAMERA_CONFIG.initialPosition);
  return camera;
}

export function resizeFollowCamera(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

export function updateFollowCamera({ camera, target, pointerState, delta }) {
  focusTarget.copy(target).add(targetOffset);
  rotatedOffset.copy(followOffset);
  rotatedOffset.applyAxisAngle(xAxis, pointerState.pitch);
  rotatedOffset.applyAxisAngle(upVector, pointerState.yaw);

  desiredPosition.copy(focusTarget).add(rotatedOffset);
  camera.position.lerp(desiredPosition, dampingFactor(CAMERA_CONFIG.followDamping, delta));
  camera.lookAt(focusTarget);
}
