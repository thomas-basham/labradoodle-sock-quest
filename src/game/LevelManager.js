import { PALETTE } from "./config";

const SUNNY_BACKYARD = {
  id: "sunny-backyard",
  name: "Sunny Backyard",
  description: "Golden light, tidy flower patches, and the usual suspicious sock activity.",
  mood: {
    fogColor: 0xf6d78d,
    skyTop: 0x7bc0ff,
    skyBottom: 0xffe4aa,
    hemiSkyColor: 0xfff1d5,
    hemiGroundColor: 0x5c7d3e,
    hemiIntensity: 1.5,
    sunColor: 0xfff6db,
    sunIntensity: 2.2,
    sunPosition: [18, 26, 10],
    groundColor: PALETTE.grass,
    pathColor: PALETTE.path,
    windowColor: 0x9cc8ff,
    windowOpacity: 0.78,
    windowGlow: 0x000000,
    windowGlowIntensity: 0,
  },
  dressing: {
    trees: [
      { position: [-19, 0, -13], scale: 1.3 },
      { position: [16, 0, -17], scale: 1.1 },
      { position: [-23, 0, 8], scale: 0.95 },
      { position: [21, 0, 10], scale: 1.05 },
    ],
    flowerPatches: [
      [-7.5, 0, 20.2],
      [8.4, 0, 20.4],
      [-18.5, 0, 2.5],
      [14.8, 0, -7.8],
    ],
    toyBones: [
      [10.2, 0.16, 5.5],
      [-8.7, 0.16, -4.8],
    ],
    laundryBaskets: [
      { position: [15.4, 0, 12.8], rotationY: 0.45 },
    ],
    bushes: [
      { position: [-13.5, 0, 14.2], scale: 1 },
      { position: [13.8, 0, -13.5], scale: 0.9 },
    ],
  },
  hazards: {
    counts: {
      mud: 2,
      toyPile: 1,
      sprinkler: 1,
      gardenBed: 2,
    },
    candidates: {
      mud: [
        { x: -16, z: -13, radius: 2.5 },
        { x: -3, z: -11, radius: 2.3 },
        { x: 8, z: 3, radius: 2.2 },
        { x: 15, z: 11, radius: 2.4 },
      ],
      toyPile: [
        { x: -15, z: 6, radius: 1.7 },
        { x: 11, z: -10, radius: 1.7 },
        { x: 2, z: 11, radius: 1.7 },
        { x: 17, z: 2, radius: 1.7 },
      ],
      sprinkler: [
        { x: 0, z: 0, radius: 3.4 },
        { x: -8, z: -1, radius: 3.2 },
        { x: 9, z: 1, radius: 3.2 },
      ],
      gardenBed: [
        { x: -18, z: 14, halfWidth: 2.6, halfDepth: 1.35 },
        { x: 18, z: 14, halfWidth: 2.8, halfDepth: 1.35 },
        { x: -20, z: -6, halfWidth: 2.2, halfDepth: 1.45 },
        { x: 20, z: -8, halfWidth: 2.4, halfDepth: 1.45 },
      ],
    },
  },
  sockSpawnPoints: [
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
  ],
};

const EVENING_BACKYARD = {
  id: "evening-backyard",
  name: "Evening Backyard",
  description: "Blue dusk, warm porch windows, and socks hiding where the shadows get cozy.",
  mood: {
    fogColor: 0x9e8cb6,
    skyTop: 0x27446d,
    skyBottom: 0xf2b176,
    hemiSkyColor: 0x9bb6df,
    hemiGroundColor: 0x34472e,
    hemiIntensity: 1.05,
    sunColor: 0xffc483,
    sunIntensity: 1.45,
    sunPosition: [-18, 14, 8],
    groundColor: 0x6d9353,
    pathColor: 0xc49874,
    windowColor: 0xffd49b,
    windowOpacity: 0.92,
    windowGlow: 0xffbf7a,
    windowGlowIntensity: 0.4,
  },
  dressing: {
    trees: [
      { position: [-21, 0, -10], scale: 1.25 },
      { position: [18, 0, -15], scale: 1.15 },
      { position: [-14, 0, 11], scale: 0.88 },
      { position: [22, 0, 8], scale: 0.94 },
    ],
    bushes: [
      { position: [-8.4, 0, 18.4], scale: 1.15 },
      { position: [9.1, 0, 18.1], scale: 1.08 },
      { position: [-18.5, 0, -1.5], scale: 0.92 },
    ],
    lanterns: [
      { position: [-5.2, 0, 18.4], height: 2.9 },
      { position: [5.2, 0, 18.4], height: 2.9 },
      { position: [-14.5, 0, 7.4], height: 2.6 },
      { position: [14.8, 0, -5.8], height: 2.6 },
    ],
    fireflies: [
      { position: [-15, 2.2, -8], radius: 2.6, count: 7 },
      { position: [10, 2.4, 4], radius: 2.3, count: 6 },
    ],
    flowerPatches: [
      [-6.2, 0, 20.1],
      [7.1, 0, 20.2],
      [16.4, 0, 2.8],
    ],
  },
  hazards: {
    counts: {
      mud: 2,
      toyPile: 1,
      sprinkler: 1,
      gardenBed: 2,
    },
    candidates: {
      mud: [
        { x: -12, z: -12, radius: 2.3 },
        { x: 4, z: -9, radius: 2.2 },
        { x: 13, z: 6, radius: 2.4 },
        { x: -7, z: 8, radius: 2.1 },
      ],
      toyPile: [
        { x: -17, z: 3, radius: 1.7 },
        { x: 7, z: 12, radius: 1.7 },
        { x: 16, z: -6, radius: 1.7 },
      ],
      sprinkler: [
        { x: -4, z: 0, radius: 3.1 },
        { x: 11, z: 0, radius: 3.3 },
        { x: -11, z: -2, radius: 3.1 },
      ],
      gardenBed: [
        { x: -18, z: 13, halfWidth: 2.7, halfDepth: 1.35 },
        { x: 18, z: 12, halfWidth: 2.7, halfDepth: 1.35 },
        { x: -19, z: -9, halfWidth: 2.3, halfDepth: 1.5 },
        { x: 20, z: -11, halfWidth: 2.5, halfDepth: 1.45 },
      ],
    },
  },
  sockSpawnPoints: [
    [-15, 0.2, -11],
    [12, 0.2, -12],
    [-8, 0.2, 6],
    [4, 0.2, 11],
    [15, 0.2, 3],
    [-4, 0.2, -5],
    [10, 0.2, -2],
    [-17, 0.2, 1],
    [18, 0.2, 8],
    [-10, 0.2, 12],
    [2, 0.2, -14],
    [7, 0.2, 5],
  ],
};

const CHAOTIC_LAUNDRY_DAY = {
  id: "chaotic-laundry-day",
  name: "Chaotic Laundry Day",
  description: "Clotheslines, hamper clutter, and enough backyard nonsense to make every sock suspicious.",
  mood: {
    fogColor: 0xf0c58a,
    skyTop: 0x9ed0ff,
    skyBottom: 0xffe0b6,
    hemiSkyColor: 0xffe8c6,
    hemiGroundColor: 0x61773d,
    hemiIntensity: 1.35,
    sunColor: 0xfff1c5,
    sunIntensity: 1.95,
    sunPosition: [10, 24, -6],
    groundColor: 0x95bb5a,
    pathColor: 0xe0b27d,
    windowColor: 0xb9d2ff,
    windowOpacity: 0.8,
    windowGlow: 0x000000,
    windowGlowIntensity: 0,
  },
  dressing: {
    trees: [
      { position: [-20, 0, -13], scale: 1.12 },
      { position: [20, 0, -15], scale: 1.06 },
      { position: [-21, 0, 9], scale: 0.9 },
    ],
    flowerPatches: [
      [-8.2, 0, 20.2],
      [7.9, 0, 20.2],
    ],
    laundryBaskets: [
      { position: [-12.5, 0, 9.8], rotationY: 0.2 },
      { position: [13.2, 0, -6.4], rotationY: -0.45 },
    ],
    laundryPiles: [
      { position: [-2.5, 0, 4.8], rotationY: 0.35 },
      { position: [7.8, 0, -3.4], rotationY: -0.25 },
      { position: [-9.8, 0, -6.8], rotationY: 0.5 },
    ],
    clotheslines: [
      { position: [-7.5, 0, -1.5], rotationY: 0.12, span: 8.5 },
      { position: [8.2, 0, 6.8], rotationY: -0.2, span: 7.2 },
    ],
    toyBones: [
      [12.4, 0.16, 8.8],
      [-10.5, 0.16, -4.4],
      [3.2, 0.16, -11.4],
    ],
    bushes: [
      { position: [-17.4, 0, 14.2], scale: 0.9 },
      { position: [18.6, 0, 13.2], scale: 0.95 },
    ],
  },
  hazards: {
    counts: {
      mud: 2,
      toyPile: 2,
      sprinkler: 1,
      gardenBed: 2,
    },
    candidates: {
      mud: [
        { x: -10, z: -9, radius: 2.3 },
        { x: 2, z: -10, radius: 2.2 },
        { x: 10, z: 2, radius: 2.4 },
        { x: -4, z: 9, radius: 2.1 },
      ],
      toyPile: [
        { x: -14, z: 5, radius: 1.7 },
        { x: -1, z: 11, radius: 1.7 },
        { x: 12, z: -8, radius: 1.7 },
        { x: 16, z: 5, radius: 1.7 },
      ],
      sprinkler: [
        { x: 5, z: 0, radius: 3.2 },
        { x: -7, z: -1, radius: 3.1 },
      ],
      gardenBed: [
        { x: -18, z: 14, halfWidth: 2.5, halfDepth: 1.35 },
        { x: 18, z: 14, halfWidth: 2.5, halfDepth: 1.35 },
        { x: -19, z: -10, halfWidth: 2.4, halfDepth: 1.45 },
        { x: 20, z: -10, halfWidth: 2.4, halfDepth: 1.45 },
      ],
    },
  },
  sockSpawnPoints: [
    [-13, 0.2, 10],
    [-8, 0.2, -7],
    [0, 0.2, 9],
    [8, 0.2, 7],
    [14, 0.2, -8],
    [-3, 0.2, 3],
    [11, 0.2, -2],
    [-15, 0.2, 2],
    [4, 0.2, -12],
    [18, 0.2, 5],
    [-6, 0.2, 12],
    [6, 0.2, 1],
  ],
};

const LEVELS = [SUNNY_BACKYARD, EVENING_BACKYARD, CHAOTIC_LAUNDRY_DAY];

export class LevelManager {
  constructor(levels = LEVELS) {
    this.levels = levels;
    this.currentIndex = 0;
  }

  resetCampaign() {
    this.currentIndex = 0;
  }

  getCurrentLevel() {
    return this.levels[this.currentIndex];
  }

  getNextLevel() {
    return this.levels[this.currentIndex + 1] ?? null;
  }

  getCurrentLevelNumber() {
    return this.currentIndex + 1;
  }

  getTotalLevels() {
    return this.levels.length;
  }

  getLevelLabel() {
    return `Yard ${this.getCurrentLevelNumber()} of ${this.getTotalLevels()} · ${this.getCurrentLevel().name}`;
  }

  hasNextLevel() {
    return this.currentIndex < this.levels.length - 1;
  }

  advanceLevel() {
    if (!this.hasNextLevel()) {
      return false;
    }

    this.currentIndex += 1;
    return true;
  }

  getPreviewLevels() {
    return this.levels.map((level, index) => ({
      number: index + 1,
      name: level.name,
      description: level.description,
    }));
  }
}
