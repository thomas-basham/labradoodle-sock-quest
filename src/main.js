import * as THREE from "three";

const app = document.getElementById("app");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const overlayButton = document.getElementById("overlayButton");
const objectiveText = document.getElementById("objectiveText");
const movePad = document.getElementById("movePad");
const moveKnob = document.getElementById("moveKnob");
const sprintButton = document.getElementById("sprintButton");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf6d78d, 36, 105);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  250,
);
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const tempVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

const world = {
  size: 28,
  gameStarted: false,
  state: "intro",
  objective: "Wake up, wiggle, and find the missing sock.",
};

const pointerState = {
  active: false,
  x: 0,
  y: 0,
  yaw: 0,
  pitch: 0.18,
};

const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  moveX: 0,
  moveY: 0,
};

const touchControls = {
  moveId: null,
  lookId: null,
  moveVector: new THREE.Vector2(),
};

const palette = {
  grass: new THREE.Color(0x8dbf57),
  fur: new THREE.Color(0xd8b684),
  furDark: new THREE.Color(0x9e6e3e),
  furLight: new THREE.Color(0xf0d4a5),
  collar: new THREE.Color(0x3a88e2),
  porch: new THREE.Color(0x8b6a49),
  house: new THREE.Color(0xf4ead0),
  roof: new THREE.Color(0xa14f2d),
  ownerShirt: new THREE.Color(0xcd5d52),
  ownerJeans: new THREE.Color(0x365485),
  sock: new THREE.Color(0xf7efe5),
  sockStripe: new THREE.Color(0xe37d47),
  path: new THREE.Color(0xdab575),
};

const groundMaterial = new THREE.MeshStandardMaterial({
  color: palette.grass,
  roughness: 0.94,
  metalness: 0,
});

const pathMaterial = new THREE.MeshStandardMaterial({
  color: palette.path,
  roughness: 1,
});

function makeStandardMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xfff1d5, 0x5c7d3e, 1.5);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff6db, 2.2);
  sun.position.set(18, 26, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 90;
  scene.add(sun);
}

function addSkyDome() {
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(120, 48, 48),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        colorA: { value: new THREE.Color(0x7bc0ff) },
        colorB: { value: new THREE.Color(0xffe4aa) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorA;
        uniform vec3 colorB;
        varying vec3 vWorldPosition;
        void main() {
          float heightMix = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(colorB, colorA, smoothstep(0.1, 0.92, heightMix));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  scene.add(dome);
}

function createGround() {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(54, 72), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(7, 10), pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.03, 18.2);
  path.receiveShadow = true;
  scene.add(path);
}

function createFence() {
  const fence = new THREE.Group();
  const railMaterial = makeStandardMaterial(0x9d7346, 0.82);
  const postGeometry = new THREE.BoxGeometry(0.35, 1.7, 0.35);
  const railGeometry = new THREE.BoxGeometry(4.6, 0.18, 0.18);
  const limit = world.size + 2;

  function addSegment(x, z, horizontal) {
    const postA = new THREE.Mesh(postGeometry, railMaterial);
    const postB = new THREE.Mesh(postGeometry, railMaterial);
    postA.castShadow = true;
    postB.castShadow = true;
    postA.position.set(x - (horizontal ? 2.2 : 0), 0.85, z - (horizontal ? 0 : 2.2));
    postB.position.set(x + (horizontal ? 2.2 : 0), 0.85, z + (horizontal ? 0 : 2.2));

    const railTop = new THREE.Mesh(railGeometry, railMaterial);
    const railBottom = railTop.clone();
    railTop.castShadow = true;
    railBottom.castShadow = true;
    if (!horizontal) {
      railTop.rotation.y = Math.PI / 2;
      railBottom.rotation.y = Math.PI / 2;
    }
    railTop.position.set(x, 1.24, z);
    railBottom.position.set(x, 0.7, z);
    fence.add(postA, postB, railTop, railBottom);
  }

  for (let i = -limit + 4; i < limit - 2; i += 4.5) {
    addSegment(i, -limit, true);
    addSegment(i, limit, true);
    addSegment(-limit, i, false);
    addSegment(limit, i, false);
  }

  scene.add(fence);
}

function createHouseAndPorch() {
  const house = new THREE.Group();
  const houseMaterial = makeStandardMaterial(palette.house, 0.92);
  const trimMaterial = makeStandardMaterial(0xf8f6ed, 0.6);
  const roofMaterial = makeStandardMaterial(palette.roof, 0.9);
  const porchMaterial = makeStandardMaterial(palette.porch, 0.88);

  const body = new THREE.Mesh(new THREE.BoxGeometry(11, 7.2, 7.2), houseMaterial);
  body.position.set(0, 3.6, 25);
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 3.6, 4), roofMaterial);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 8.35, 25);
  roof.castShadow = true;
  house.add(roof);

  const porch = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.9, 4.4), porchMaterial);
  porch.position.set(0, 0.45, 18.7);
  porch.castShadow = true;
  porch.receiveShadow = true;
  house.add(porch);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.3, 0.22), porchMaterial);
  door.position.set(0, 2.05, 21.35);
  door.castShadow = true;
  house.add(door);

  for (const side of [-3.1, 3.1]) {
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.8, 0.24),
      trimMaterial,
    );
    windowFrame.position.set(side, 4.15, 21.28);
    windowFrame.castShadow = true;
    house.add(windowFrame);

    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x9cc8ff,
        transparent: true,
        opacity: 0.78,
        roughness: 0.12,
        metalness: 0.05,
      }),
    );
    pane.position.set(side, 4.15, 21.42);
    house.add(pane);
  }

  scene.add(house);
}

function createTree(position, scale) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.8, 4.2, 10),
    makeStandardMaterial(0x7f5a38, 0.95),
  );
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const foliageMaterial = makeStandardMaterial(0x699242, 0.88);
  const foliagePieces = [
    [0, 5.2, 0, 2.2],
    [-1.1, 4.4, 0.4, 1.7],
    [1.2, 4.6, -0.4, 1.8],
    [0.2, 3.9, -1.0, 1.5],
  ];

  for (const [x, y, z, size] of foliagePieces) {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), foliageMaterial);
    crown.position.set(x, y, z);
    crown.castShadow = true;
    tree.add(crown);
  }

  tree.position.copy(position);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

function createFlowerPatch(position) {
  const patch = new THREE.Group();
  const flowerColors = [0xffcf71, 0xff88a9, 0xffffff, 0xffa64f];

  for (let i = 0; i < 8; i += 1) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 0.55, 6),
      makeStandardMaterial(0x557b38, 0.9),
    );
    const blossom = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      makeStandardMaterial(flowerColors[i % flowerColors.length], 0.55),
    );
    stem.position.set(
      (Math.random() - 0.5) * 1.6,
      0.28,
      (Math.random() - 0.5) * 1.3,
    );
    blossom.position.copy(stem.position).add(new THREE.Vector3(0, 0.34, 0));
    stem.castShadow = true;
    blossom.castShadow = true;
    patch.add(stem, blossom);
  }

  patch.position.copy(position);
  scene.add(patch);
}

function createToyBone(position) {
  const group = new THREE.Group();
  const material = makeStandardMaterial(0xf7ead8, 0.9);

  const center = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.7, 4, 8), material);
  center.rotation.z = Math.PI / 2;
  center.castShadow = true;
  group.add(center);

  for (const x of [-0.52, 0.52]) {
    for (const z of [-0.18, 0.18]) {
      const nub = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), material);
      nub.position.set(x, 0, z);
      nub.castShadow = true;
      group.add(nub);
    }
  }

  group.position.copy(position);
  group.rotation.y = Math.random() * Math.PI;
  scene.add(group);
}

function createOwner() {
  const owner = new THREE.Group();
  const skin = makeStandardMaterial(0xf1caab, 0.75);
  const shirt = makeStandardMaterial(palette.ownerShirt, 0.82);
  const jeans = makeStandardMaterial(palette.ownerJeans, 0.9);
  const hair = makeStandardMaterial(0x423022, 0.98);
  const shoes = makeStandardMaterial(0xffffff, 0.6);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 1.6, 6, 12), shirt);
  torso.position.y = 2.8;
  torso.castShadow = true;
  owner.add(torso);

  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 12), shirt);
  hips.position.y = 1.9;
  hips.castShadow = true;
  owner.add(hips);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), skin);
  head.position.set(0, 4.3, 0);
  head.castShadow = true;
  owner.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.64, 16, 16), hair);
  hairCap.position.set(0, 4.48, -0.04);
  hairCap.scale.set(1.03, 0.8, 1.04);
  hairCap.castShadow = true;
  owner.add(hairCap);

  for (const x of [-0.42, 0.42]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.15, 4, 10), shirt);
    arm.position.set(x, 2.95, 0);
    arm.rotation.z = x > 0 ? -0.15 : 0.15;
    arm.castShadow = true;
    owner.add(arm);
  }

  for (const x of [-0.28, 0.28]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.4, 4, 10), jeans);
    leg.position.set(x, 1.0, 0);
    leg.castShadow = true;
    owner.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.8), shoes);
    shoe.position.set(x, 0.08, 0.15);
    shoe.castShadow = true;
    owner.add(shoe);
  }

  owner.position.set(0, 0.5, 16.6);
  owner.rotation.y = Math.PI;
  scene.add(owner);
  return owner;
}

function createSock() {
  const sock = new THREE.Group();
  const sockMaterial = makeStandardMaterial(palette.sock, 0.92);
  const stripeMaterial = makeStandardMaterial(palette.sockStripe, 0.82);

  const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.9, 14), sockMaterial);
  ankle.position.y = 0.45;
  ankle.castShadow = true;
  sock.add(ankle);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.92, 14), sockMaterial);
  foot.rotation.z = -Math.PI / 2;
  foot.position.set(0.38, 0.06, 0);
  foot.castShadow = true;
  sock.add(foot);

  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 14), sockMaterial);
  toe.position.set(0.82, 0.06, 0);
  toe.castShadow = true;
  sock.add(toe);

  for (const y of [0.18, 0.38]) {
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.05, 10, 24), stripeMaterial);
    stripe.position.y = y;
    stripe.rotation.x = Math.PI / 2;
    stripe.castShadow = true;
    sock.add(stripe);
  }

  sock.position.set(-16, 0.2, -10);
  sock.rotation.set(Math.PI / 2, 0.6, 0.35);
  scene.add(sock);
  return sock;
}

function createMarker(colorHex) {
  const marker = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.88 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 12, 32), material);
  ring.rotation.x = Math.PI / 2;
  marker.add(ring);

  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 16), material);
  arrow.position.y = 0.55;
  marker.add(arrow);

  marker.visible = false;
  scene.add(marker);
  return marker;
}

function buildLabradoodle() {
  const dog = new THREE.Group();
  const fur = makeStandardMaterial(palette.fur, 0.98);
  const furDark = makeStandardMaterial(palette.furDark, 0.95);
  const furLight = makeStandardMaterial(palette.furLight, 0.93);
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
    makeStandardMaterial(palette.collar, 0.6),
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

  dog.position.set(0, 0, 10);
  dog.rotation.y = Math.PI;
  dog.userData = {
    head,
    torso,
    tail,
    leftEar,
    rightEar,
    legs,
    paws,
  };

  scene.add(dog);
  return dog;
}

addLights();
addSkyDome();
createGround();
createFence();
createHouseAndPorch();

createTree(new THREE.Vector3(-19, 0, -13), 1.3);
createTree(new THREE.Vector3(16, 0, -17), 1.1);
createTree(new THREE.Vector3(-23, 0, 8), 0.95);
createTree(new THREE.Vector3(21, 0, 10), 1.05);

createFlowerPatch(new THREE.Vector3(-7.5, 0, 20.2));
createFlowerPatch(new THREE.Vector3(8.4, 0, 20.4));
createFlowerPatch(new THREE.Vector3(-18.5, 0, 2.5));
createFlowerPatch(new THREE.Vector3(14.8, 0, -7.8));

createToyBone(new THREE.Vector3(10.2, 0.16, 5.5));
createToyBone(new THREE.Vector3(-8.7, 0.16, -4.8));

const owner = createOwner();
const sock = createSock();
const sockMarker = createMarker(0xfff6e0);
const ownerMarker = createMarker(0xffb365);
const dog = buildLabradoodle();

const dogState = {
  position: dog.position.clone(),
  yaw: dog.rotation.y,
  speed: 0,
  velocity: new THREE.Vector3(),
  hasSock: false,
  animationTime: 0,
};

function updateObjective(text) {
  world.objective = text;
  objectiveText.textContent = text;
}

function startGame() {
  world.gameStarted = true;
  world.state = "searching";
  overlay.classList.add("hidden");
  updateObjective("Find the sock somewhere in the yard. The floating marker will guide you.");
  sockMarker.visible = true;
  ownerMarker.visible = false;
}

function winGame() {
  world.state = "complete";
  world.gameStarted = false;
  overlayTitle.textContent = "Sock returned";
  overlayBody.textContent =
    "You trot up to your human, present the sock like a hero, and earn maximum good dog status.";
  overlayButton.textContent = "Play again";
  overlay.classList.remove("hidden");
  updateObjective("Mission complete. Click Play again to hide another sock.");
  sockMarker.visible = false;
  ownerMarker.visible = false;
}

function resetGame() {
  const spawnPoints = [
    new THREE.Vector3(-16, 0.2, -10),
    new THREE.Vector3(14, 0.2, -13),
    new THREE.Vector3(-11, 0.2, 4),
    new THREE.Vector3(9, 0.2, 8),
    new THREE.Vector3(16, 0.2, -2),
  ];
  const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  sock.position.copy(point);
  sock.rotation.set(Math.PI / 2, Math.random() * Math.PI, 0.35);
  scene.attach(sock);

  dog.position.set(0, 0, 10);
  dog.rotation.y = Math.PI;
  dogState.position.copy(dog.position);
  dogState.yaw = dog.rotation.y;
  dogState.speed = 0;
  dogState.velocity.set(0, 0, 0);
  dogState.hasSock = false;
  dogState.animationTime = 0;

  overlayTitle.textContent = "Find the Missing Sock";
  overlayBody.textContent =
    "You are a determined labradoodle. Sniff out the sock, grab it, and bring it back to your human by the porch.";
  overlayButton.textContent = "Start sniffing";
  startGame();
}

overlayButton.addEventListener("click", () => {
  if (world.state === "complete") {
    resetGame();
    return;
  }
  startGame();
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "w" || key === "arrowup") input.forward = true;
  if (key === "s" || key === "arrowdown") input.backward = true;
  if (key === "a" || key === "arrowleft") input.left = true;
  if (key === "d" || key === "arrowright") input.right = true;
  if (key === "shift") input.sprint = true;
  if (key === "enter" && !world.gameStarted && world.state !== "complete") startGame();
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "w" || key === "arrowup") input.forward = false;
  if (key === "s" || key === "arrowdown") input.backward = false;
  if (key === "a" || key === "arrowleft") input.left = false;
  if (key === "d" || key === "arrowright") input.right = false;
  if (key === "shift") input.sprint = false;
});

renderer.domElement.addEventListener("pointerdown", () => {
  pointerState.active = true;
});

window.addEventListener("pointerup", () => {
  pointerState.active = false;
});

window.addEventListener("pointermove", (event) => {
  if (!pointerState.active) return;
  pointerState.yaw -= event.movementX * 0.0034;
  pointerState.pitch = THREE.MathUtils.clamp(
    pointerState.pitch - event.movementY * 0.0022,
    -0.15,
    0.6,
  );
});

function setMoveVector(x, y) {
  touchControls.moveVector.set(x, y);
  input.moveX = x;
  input.moveY = y;
  moveKnob.style.transform = `translate(${x * 36}px, ${y * 36}px)`;
}

function clearMoveVector() {
  setMoveVector(0, 0);
}

movePad.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    touchControls.moveId = touch.identifier;
    const rect = movePad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.min(Math.hypot(dx, dy), 40);
    const angle = Math.atan2(dy, dx);
    setMoveVector((Math.cos(angle) * distance) / 40, (Math.sin(angle) * distance) / 40);
  },
  { passive: true },
);

movePad.addEventListener(
  "touchmove",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier !== touchControls.moveId) continue;
      const rect = movePad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const distance = Math.min(Math.hypot(dx, dy), 40);
      const angle = Math.atan2(dy, dx);
      const axisX = (Math.cos(angle) * distance) / 40;
      const axisY = (Math.sin(angle) * distance) / 40;
      setMoveVector(axisX, axisY);
    }
  },
  { passive: true },
);

movePad.addEventListener(
  "touchend",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchControls.moveId) {
        touchControls.moveId = null;
        clearMoveVector();
      }
    }
  },
  { passive: true },
);

movePad.addEventListener(
  "touchcancel",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchControls.moveId) {
        touchControls.moveId = null;
        clearMoveVector();
      }
    }
  },
  { passive: true },
);

sprintButton.addEventListener("touchstart", () => {
  input.sprint = true;
});

sprintButton.addEventListener("touchend", () => {
  input.sprint = false;
});

sprintButton.addEventListener("touchcancel", () => {
  input.sprint = false;
});

window.addEventListener(
  "touchstart",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touchControls.moveId === touch.identifier) continue;
      if (touchControls.lookId !== null) continue;
      touchControls.lookId = touch.identifier;
      pointerState.x = touch.clientX;
      pointerState.y = touch.clientY;
    }
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier !== touchControls.lookId) continue;
      const dx = touch.clientX - pointerState.x;
      const dy = touch.clientY - pointerState.y;
      pointerState.x = touch.clientX;
      pointerState.y = touch.clientY;
      pointerState.yaw -= dx * 0.004;
      pointerState.pitch = THREE.MathUtils.clamp(pointerState.pitch - dy * 0.003, -0.15, 0.6);
    }
  },
  { passive: true },
);

window.addEventListener(
  "touchend",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchControls.lookId) {
        touchControls.lookId = null;
      }
    }
  },
  { passive: true },
);

window.addEventListener(
  "touchcancel",
  (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === touchControls.lookId) {
        touchControls.lookId = null;
      }
    }
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function getMoveIntent() {
  const move = new THREE.Vector3();
  move.x += input.moveX;
  move.z += input.moveY;
  if (input.forward) move.z -= 1;
  if (input.backward) move.z += 1;
  if (input.left) move.x -= 1;
  if (input.right) move.x += 1;
  if (move.lengthSq() > 0) move.normalize();
  return move;
}

function animateDog(delta) {
  const moving = dogState.speed > 0.4;
  dogState.animationTime += delta * (moving ? 9.5 : 3.2);

  const walkCycle = Math.sin(dogState.animationTime);
  const bounce = moving ? Math.abs(Math.sin(dogState.animationTime * 2)) * 0.08 : 0;
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

function updateDog(delta) {
  if (!world.gameStarted) {
    dogState.speed = 0;
    animateDog(delta);
    return;
  }

  const moveIntent = getMoveIntent();
  if (moveIntent.lengthSq() > 0) {
    const moveAngle = Math.atan2(moveIntent.x, moveIntent.z);
    const targetYaw = pointerState.yaw + moveAngle + Math.PI;
    dogState.yaw = THREE.MathUtils.lerp(dogState.yaw, targetYaw, 1 - Math.exp(-delta * 9));
  }

  const speedTarget = moveIntent.lengthSq() > 0 ? (input.sprint ? 8.9 : 5.7) : 0;
  dogState.speed = THREE.MathUtils.lerp(dogState.speed, speedTarget, 1 - Math.exp(-delta * 8));

  const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(upVector, dogState.yaw);
  dogState.velocity.copy(direction).multiplyScalar(dogState.speed * delta);
  dogState.position.add(dogState.velocity);

  const limit = world.size;
  dogState.position.x = THREE.MathUtils.clamp(dogState.position.x, -limit, limit);
  dogState.position.z = THREE.MathUtils.clamp(dogState.position.z, -limit + 2, limit - 5);

  dog.position.x = dogState.position.x;
  dog.position.z = dogState.position.z;
  dog.rotation.y = dogState.yaw;

  animateDog(delta);
}

function updateCamera(delta) {
  const target = dog.position.clone().add(new THREE.Vector3(0, 2.3, 0));
  const yaw = pointerState.yaw;
  const pitch = pointerState.pitch;

  const offset = new THREE.Vector3(0, 4.4, 8.6);
  offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
  offset.applyAxisAngle(upVector, yaw);

  const desired = target.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.exp(-delta * 5));
  camera.lookAt(target);
}

function updateMarkers(elapsed) {
  const bob = Math.sin(elapsed * 3.5) * 0.18;

  if (!dogState.hasSock) {
    sockMarker.visible = world.gameStarted;
    sockMarker.position.set(sock.position.x, 2.1 + bob, sock.position.z);
    sockMarker.rotation.y = elapsed * 1.3;
    ownerMarker.visible = false;
  } else {
    ownerMarker.visible = world.gameStarted;
    ownerMarker.position.set(owner.position.x, 3.6 + bob, owner.position.z);
    ownerMarker.rotation.y = elapsed * 1.2;
    sockMarker.visible = false;
  }
}

function pickupSock() {
  dogState.hasSock = true;
  dog.attach(sock);
  sock.position.set(3.02, 2.2, 0);
  sock.rotation.set(0.2, 0.2, -0.8);
  updateObjective("Sock secured. Bring it back to your human by the porch.");
}

function checkObjectives() {
  if (world.state === "searching") {
    const distanceToSock = dog.position.distanceTo(sock.position);
    if (distanceToSock < 2.1) {
      world.state = "returning";
      pickupSock();
    }
    return;
  }

  if (world.state === "returning") {
    const ownerPosition = owner.getWorldPosition(tempVector);
    const distanceToOwner = dog.position.distanceTo(ownerPosition);
    if (distanceToOwner < 4.2) {
      scene.attach(sock);
      sock.position.set(owner.position.x + 0.45, 1.18, owner.position.z + 0.2);
      sock.rotation.set(Math.PI / 2, 0.45, 0.2);
      winGame();
    }
  }
}

function render() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  updateDog(delta);
  updateCamera(delta);
  updateMarkers(elapsed);
  checkObjectives();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();
