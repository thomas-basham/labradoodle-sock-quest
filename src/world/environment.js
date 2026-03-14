import * as THREE from "three";

import { PALETTE } from "../game/config";

function makeStandardMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

function addLights(scene) {
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

function addSkyDome(scene) {
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

function createGround(scene) {
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.grass,
    roughness: 0.94,
    metalness: 0,
  });

  const pathMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.path,
    roughness: 1,
  });

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

function createFence(scene, worldSize) {
  const fence = new THREE.Group();
  const railMaterial = makeStandardMaterial(0x9d7346, 0.82);
  const postGeometry = new THREE.BoxGeometry(0.35, 1.7, 0.35);
  const railGeometry = new THREE.BoxGeometry(4.6, 0.18, 0.18);
  const limit = worldSize + 2;

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

function createHouseAndPorch(scene) {
  const house = new THREE.Group();
  const houseMaterial = makeStandardMaterial(PALETTE.house, 0.92);
  const trimMaterial = makeStandardMaterial(0xf8f6ed, 0.6);
  const roofMaterial = makeStandardMaterial(PALETTE.roof, 0.9);
  const porchMaterial = makeStandardMaterial(PALETTE.porch, 0.88);

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

function createTree(scene, position, scale) {
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

function createFlowerPatch(scene, position) {
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

function createToyBone(scene, position) {
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

function createLaundryBasket(scene, position, rotationY = 0) {
  const basket = new THREE.Group();
  const basketMaterial = makeStandardMaterial(0xcaa271, 0.9);
  const trimMaterial = makeStandardMaterial(0xa67f52, 0.88);
  const clothColors = [0xf3d2a2, 0xffb2c7, PALETTE.sock, PALETTE.sockStripe];

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.04, 1.08, 18, 1, true),
    basketMaterial,
  );
  shell.position.y = 0.58;
  shell.castShadow = true;
  shell.receiveShadow = true;
  basket.add(shell);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.86, 0.16, 18), trimMaterial);
  base.position.y = 0.08;
  base.castShadow = true;
  basket.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.07, 12, 28), trimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.08;
  rim.castShadow = true;
  basket.add(rim);

  for (let i = 0; i < 4; i += 1) {
    const cloth = new THREE.Mesh(
      new THREE.SphereGeometry(0.24 + i * 0.02, 14, 14),
      makeStandardMaterial(clothColors[i % clothColors.length], 0.92),
    );
    cloth.position.set(-0.26 + i * 0.19, 1.0 + (i % 2) * 0.08, -0.06 + i * 0.06);
    cloth.castShadow = true;
    basket.add(cloth);
  }

  basket.position.copy(position);
  basket.rotation.y = rotationY;
  scene.add(basket);
}

export function buildEnvironment({ scene, worldSize }) {
  addLights(scene);
  addSkyDome(scene);
  createGround(scene);
  createFence(scene, worldSize);
  createHouseAndPorch(scene);

  createTree(scene, new THREE.Vector3(-19, 0, -13), 1.3);
  createTree(scene, new THREE.Vector3(16, 0, -17), 1.1);
  createTree(scene, new THREE.Vector3(-23, 0, 8), 0.95);
  createTree(scene, new THREE.Vector3(21, 0, 10), 1.05);

  createFlowerPatch(scene, new THREE.Vector3(-7.5, 0, 20.2));
  createFlowerPatch(scene, new THREE.Vector3(8.4, 0, 20.4));
  createFlowerPatch(scene, new THREE.Vector3(-18.5, 0, 2.5));
  createFlowerPatch(scene, new THREE.Vector3(14.8, 0, -7.8));

  createToyBone(scene, new THREE.Vector3(10.2, 0.16, 5.5));
  createToyBone(scene, new THREE.Vector3(-8.7, 0.16, -4.8));
}
