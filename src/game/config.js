export const GAME_STATES = {
  intro: "intro",
  searching: "searching",
  returning: "returning",
  complete: "complete",
};

export const WORLD_SIZE = 28;

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
};

export const OBJECTIVES = {
  intro: "Wake up, wiggle, and find the missing sock.",
  searching: "Find the sock somewhere in the yard. The floating marker will guide you.",
  returning: "Sock secured. Bring it back to your human by the porch.",
  complete: "Mission complete. Click Play again to hide another sock.",
};

export const OVERLAY_COPY = {
  intro: {
    title: "Find the Missing Sock",
    body: "You are a determined labradoodle. Sniff out the sock, grab it, and bring it back to your human by the porch.",
    buttonLabel: "Start sniffing",
  },
  win: {
    title: "Sock returned",
    body: "You trot up to your human, present the sock like a hero, and earn maximum good dog status.",
    buttonLabel: "Play again",
  },
};

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

export const SOCK_SPAWN_POINTS = [
  [-16, 0.2, -10],
  [14, 0.2, -13],
  [-11, 0.2, 4],
  [9, 0.2, 8],
  [16, 0.2, -2],
];
