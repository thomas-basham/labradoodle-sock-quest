export const GAME_STATES = {
  intro: "intro",
  searching: "searching",
  returning: "returning",
  complete: "complete",
};

export const WORLD_SIZE = 28;
export const DOG_NAME = "Ray";

export const PALETTE = {
  grass: 0x8dbf57,
  fur: 0xd8b684,
  furDark: 0x9e6e3e,
  furLight: 0xf0d4a5,
  collar: 0x3a88e2,
  porch: 0x8b6a49,
  house: 0xf4ead0,
  roof: 0xa14f2d,
  ownerShirt: 0xcd5d52,
  ownerJeans: 0x365485,
  sock: 0xf7efe5,
  sockStripe: 0xe37d47,
  path: 0xdab575,
  scent: 0xffd88d,
  scentGlow: 0xfff2bf,
  mud: 0x755137,
  mudHighlight: 0x916240,
  toyRed: 0xe86c58,
  toyBlue: 0x59a6e9,
  toyYellow: 0xf1be52,
  sprinkler: 0x5fb8eb,
  sprinklerGlow: 0xb8edff,
  gardenSoil: 0x6f4a2e,
  gardenBorder: 0xb68454,
  gardenLeaf: 0x5d8c44,
};

export const OBJECTIVES = {
  intro: "Ray is on backyard patrol and ready to sniff out a runaway sock.",
  complete: "Round complete. Ray returned every last sock in the yard.",
};

export function getSearchingObjective(returnedCount, totalSocks) {
  const currentSock = Math.min(returnedCount + 1, totalSocks);
  return `Sock ${currentSock} of ${totalSocks}: guide Ray to the next missing sock.`;
}

export function getReturningObjective(returnedCount, totalSocks) {
  const currentSock = Math.min(returnedCount + 1, totalSocks);
  return `Sock ${currentSock} of ${totalSocks} secured. Bring it back to Ray's human by the porch.`;
}

export const OVERLAY_COPY = {
  intro: {
    title: "Ray and the Missing Sock",
    body: "Ray is a sock-obsessed labradoodle with a nose for laundry-related chaos. Track down the missing socks, tap sniff when you need a lead, grab each one, and parade it back to her human like the neighborhood legend she is.",
    buttonLabel: "Unleash Ray",
  },
  complete: {
    title: "Round complete",
    body: "Ray rounded up every missing sock in the yard and is awaiting the official post-laundry parade.",
    buttonLabel: "Play again",
  },
};

export const DEFAULT_FLAVOR_MESSAGE = "Ray's sock radar is on warm-up duty.";

export const FLAVOR_MESSAGES = [
  "Ray has detected forbidden laundry.",
  "Sock radar activated.",
  "No ankle garment is safe.",
  "Ray suspects the sock is trying to hide.",
  "Laundry turbulence in the backyard.",
  "The scent profile is 82% cotton, 18% mischief.",
  "Ray is operating at maximum sniffacity.",
  "Alert: lone sock energy is rising.",
];

export const SCENE_CONFIG = {
  fogColor: 0xf6d78d,
  fogNear: 36,
  fogFar: 105,
};

export const CAMERA_CONFIG = {
  fov: 60,
  near: 0.1,
  far: 250,
  initialPosition: [0, 6, 12],
  targetOffset: [0, 2.3, 0],
  followOffset: [0, 4.4, 8.6],
  initialYaw: 0,
  initialPitch: 0.18,
  minPitch: -0.15,
  maxPitch: 0.6,
  followDamping: 5,
  mouseYawSpeed: 0.0034,
  mousePitchSpeed: 0.0022,
  touchYawSpeed: 0.004,
  touchPitchSpeed: 0.003,
};

export const MOVEMENT_CONFIG = {
  walkSpeed: 5.7,
  sprintSpeed: 8.9,
  yawDamping: 9,
  speedDamping: 8,
  bounds: {
    x: [-WORLD_SIZE, WORLD_SIZE],
    z: [-WORLD_SIZE + 2, WORLD_SIZE - 5],
  },
};

export const DOG_CONFIG = {
  spawn: [0, 0, 10],
  pickupDistance: 2.1,
  returnDistance: 4.2,
  carryPosition: [3.02, 2.2, 0],
  carryRotation: [0.2, 0.2, -0.8],
  deliveredPositionOffset: [0.45, 1.18, 0.2],
  deliveredRotation: [Math.PI / 2, 0.45, 0.2],
  moveAnimationSpeed: 9.5,
  idleAnimationSpeed: 3.2,
  activeSpeedThreshold: 0.4,
  bounceHeight: 0.08,
  idleBounceHeight: 0.028,
  sniffAnimationDuration: 0.75,
};

export const MARKER_CONFIG = {
  sockColor: 0xfff6e0,
  ownerColor: 0xffb365,
  bobSpeed: 3.5,
  bobHeight: 0.18,
  sockHeight: 2.1,
  ownerHeight: 3.6,
  sockSpinSpeed: 1.3,
  ownerSpinSpeed: 1.2,
};

export const JOYSTICK_CONFIG = {
  maxDistance: 40,
  knobTravel: 36,
};

export const ROUND_CONFIG = {
  socksPerRound: 5,
  bestTimeStorageKey: "ray-sock-quest-best-time-ms",
};

export const HAZARD_CONFIG = {
  defaultStatus: {
    badge: "Clear",
    title: "Backyard clear",
    detail: "Mud, squeaks, and petunias are standing by.",
  },
  mud: {
    count: 2,
    radius: 2.4,
    slowMultiplier: 0.62,
    splashIntervalMs: 280,
    badge: "Speed -38%",
    title: "Mud patrol",
    detail: "Paws full of pudding. Ray is slogging a bit.",
  },
  toyPile: {
    count: 1,
    radius: 1.7,
    nudgeStrength: 3.8,
    triggerCooldownMs: 1600,
    badge: "Boing",
    title: "Squeak ambush",
    detail: "Toy pile bounce. Dignity mostly intact.",
  },
  sprinkler: {
    count: 1,
    radius: 3.4,
    mistIntervalMs: 120,
    overlayOpacity: 0.42,
    badge: "Misty",
    title: "Sprinkler zone",
    detail: "Visibility is a tiny bit soggy in here.",
  },
  gardenBed: {
    count: 2,
    collisionPadding: 0.2,
    badge: "Blocked",
    title: "Garden border",
    detail: "No trampling the petunias, Ray.",
    calloutCooldownMs: 1200,
  },
};

export const SNIFF_CONFIG = {
  cooldownMs: 4500,
  effectDurationSeconds: 1.8,
  trailPuffCount: 6,
  trailArcHeight: 0.7,
  trailSideOffset: 0.58,
  defaultHint: "Tap Sniff to sample the backyard sock breeze.",
  introHint: "Press Space or tap Sniff once Ray is loose.",
  returningHint: "Sock secured. Bring it back to Ray's human.",
  completeHint: "Every sock has been accounted for.",
};

export function getSniffHint(distance) {
  if (distance <= 4.5) {
    return "Sock is basically under your nose";
  }

  if (distance <= 9) {
    return "Very warm";
  }

  if (distance <= 16) {
    return "Warm";
  }

  return "Ice cold";
}

export const SOCK_SPAWN_POINTS = [
  [-16, 0.2, -10],
  [14, 0.2, -13],
  [-11, 0.2, 4],
  [9, 0.2, 8],
  [16, 0.2, -2],
  [-18, 0.2, -2],
  [12, 0.2, -7],
  [-6, 0.2, 12],
  [4, 0.2, -15],
  [-14, 0.2, 10],
  [18, 0.2, 6],
  [-3, 0.2, -8],
];

export const SOCK_DELIVERY_OFFSETS = [
  [0.45, 1.18, 0.2],
  [0.85, 1.14, 0.06],
  [0.16, 1.12, -0.18],
  [0.98, 1.16, 0.42],
  [0.62, 1.2, -0.32],
];
