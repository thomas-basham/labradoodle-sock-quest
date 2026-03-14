import * as THREE from "three";

import {
  CAMERA_CONFIG,
  GAME_STATES,
  HAZARD_CONFIG,
  OBJECTIVES,
  ROUND_CONFIG,
  SNIFF_CONFIG,
  WORLD_SIZE,
} from "./config";

export function createWorldState() {
  return {
    size: WORLD_SIZE,
    gameStarted: false,
    state: GAME_STATES.intro,
    objective: OBJECTIVES.intro,
    socksReturned: 0,
    totalSocks: ROUND_CONFIG.socksPerRound,
    roundTimeMs: 0,
    bestTimeMs: null,
    flavorText: "",
    sniffHint: SNIFF_CONFIG.introHint,
    hazardBadge: HAZARD_CONFIG.defaultStatus.badge,
    hazardTitle: HAZARD_CONFIG.defaultStatus.title,
    hazardDetail: HAZARD_CONFIG.defaultStatus.detail,
    sprinklerOverlay: 0,
  };
}

export function createPointerState() {
  return {
    active: false,
    x: 0,
    y: 0,
    yaw: CAMERA_CONFIG.initialYaw,
    pitch: CAMERA_CONFIG.initialPitch,
  };
}

export function createInputState() {
  return {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    moveX: 0,
    moveY: 0,
  };
}

export function createTouchState() {
  return {
    moveId: null,
    lookId: null,
    moveVector: new THREE.Vector2(),
  };
}

export function createDogState(dog) {
  return {
    position: dog.position.clone(),
    yaw: dog.rotation.y,
    speed: 0,
    velocity: new THREE.Vector3(),
    externalVelocity: new THREE.Vector3(),
    hasSock: false,
    animationTime: 0,
    sniffTimer: 0,
    sniffAnimationTime: 0,
  };
}
