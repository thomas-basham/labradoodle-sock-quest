import * as THREE from "three";

import { PALETTE } from "../game/config";

function makeStandardMaterial(color, roughness = 0.75, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
    ...extra,
  });
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

function clearGroup(group) {
  group.children.forEach((child) => disposeObject(child));
  group.clear();
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

  return { hemi, sun };
}

function addSkyDome(scene) {
  const uniforms = {
    colorA: { value: new THREE.Color(0x7bc0ff) },
    colorB: { value: new THREE.Color(0xffe4aa) },
  };

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(120, 48, 48),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms,
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
  return { dome, uniforms };
}

function createGround(parent) {
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
  parent.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(7, 10), pathMaterial);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.03, 18.2);
  path.receiveShadow = true;
  parent.add(path);

  return { groundMaterial, pathMaterial };
}

function createFence(parent, worldSize) {
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

  for (let index = -limit + 4; index < limit - 2; index += 4.5) {
    addSegment(index, -limit, true);
    addSegment(index, limit, true);
    addSegment(-limit, index, false);
    addSegment(limit, index, false);
  }

  parent.add(fence);
}

function createHouseAndPorch(parent) {
  const house = new THREE.Group();
  const houseMaterial = makeStandardMaterial(PALETTE.house, 0.92);
  const trimMaterial = makeStandardMaterial(0xf8f6ed, 0.6);
  const roofMaterial = makeStandardMaterial(PALETTE.roof, 0.9);
  const porchMaterial = makeStandardMaterial(PALETTE.porch, 0.88);
  const windowPanes = [];

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

    const paneMaterial = new THREE.MeshStandardMaterial({
      color: 0x9cc8ff,
      transparent: true,
      opacity: 0.78,
      roughness: 0.12,
      metalness: 0.05,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 0.12),
      paneMaterial,
    );
    pane.position.set(side, 4.15, 21.42);
    house.add(pane);
    windowPanes.push(pane);
  }

  parent.add(house);
  return { windowPanes };
}

function createTree(parent, position, scale) {
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

  tree.position.set(...position);
  tree.scale.setScalar(scale);
  parent.add(tree);
}

function createBush(parent, position, scale = 1) {
  const bush = new THREE.Group();
  const bushMaterial = makeStandardMaterial(0x6e9749, 0.92);

  for (const offset of [
    [-0.46, 0.34, 0.12, 0.54],
    [0.0, 0.45, -0.1, 0.66],
    [0.48, 0.32, 0.08, 0.52],
  ]) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(offset[3], 14, 14),
      bushMaterial,
    );
    puff.position.set(offset[0], offset[1], offset[2]);
    puff.castShadow = true;
    bush.add(puff);
  }

  bush.position.set(...position);
  bush.scale.setScalar(scale);
  parent.add(bush);
}

function createFlowerPatch(parent, position) {
  const patch = new THREE.Group();
  const flowerColors = [0xffcf71, 0xff88a9, 0xffffff, 0xffa64f];

  for (let index = 0; index < 8; index += 1) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, 0.55, 6),
      makeStandardMaterial(0x557b38, 0.9),
    );
    const blossom = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      makeStandardMaterial(flowerColors[index % flowerColors.length], 0.55),
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

  patch.position.set(...position);
  parent.add(patch);
}

function createToyBone(parent, position) {
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

  group.position.set(...position);
  group.rotation.y = Math.random() * Math.PI;
  parent.add(group);
}

function createLaundryBasket(parent, { position, rotationY = 0 }) {
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

  for (let index = 0; index < 4; index += 1) {
    const cloth = new THREE.Mesh(
      new THREE.SphereGeometry(0.24 + index * 0.02, 14, 14),
      makeStandardMaterial(clothColors[index % clothColors.length], 0.92),
    );
    cloth.position.set(-0.26 + index * 0.19, 1.0 + (index % 2) * 0.08, -0.06 + index * 0.06);
    cloth.castShadow = true;
    basket.add(cloth);
  }

  basket.position.set(...position);
  basket.rotation.y = rotationY;
  parent.add(basket);
}

function createLaundryPile(parent, { position, rotationY = 0 }) {
  const pile = new THREE.Group();
  const colors = [0xf6dcb2, 0xffb7ca, 0xcfe1ff, PALETTE.sockStripe];

  for (let index = 0; index < 4; index += 1) {
    const cloth = new THREE.Mesh(
      new THREE.SphereGeometry(0.28 + index * 0.04, 14, 14),
      makeStandardMaterial(colors[index % colors.length], 0.94),
    );
    cloth.scale.set(1.25, 0.55 + index * 0.05, 1.05);
    cloth.position.set(
      (Math.random() - 0.5) * 0.9,
      0.16 + index * 0.06,
      (Math.random() - 0.5) * 0.7,
    );
    cloth.castShadow = true;
    pile.add(cloth);
  }

  pile.position.set(...position);
  pile.rotation.y = rotationY;
  parent.add(pile);
}

function createLantern(parent, { position, height = 2.8 }) {
  const lantern = new THREE.Group();
  const postMaterial = makeStandardMaterial(0x715235, 0.9);
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd69a,
    emissive: 0xffd69a,
    emissiveIntensity: 0.55,
    roughness: 0.35,
    metalness: 0.02,
  });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, height, 10), postMaterial);
  post.position.y = height * 0.5;
  post.castShadow = true;
  lantern.add(post);

  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.08), postMaterial);
  crossBar.position.set(0.22, height - 0.18, 0);
  crossBar.castShadow = true;
  lantern.add(crossBar);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), glowMaterial);
  glow.position.set(0.44, height - 0.42, 0);
  lantern.add(glow);

  lantern.position.set(...position);
  parent.add(lantern);
}

function createFireflyCloud(parent, { position, radius = 2.4, count = 6 }) {
  const cloud = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xfff0a8,
    transparent: true,
    opacity: 0.8,
  });

  for (let index = 0; index < count; index += 1) {
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.03, 8, 8), material);
    glow.position.set(
      (Math.random() - 0.5) * radius,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * radius,
    );
    cloud.add(glow);
  }

  cloud.position.set(...position);
  parent.add(cloud);
}

function createClothesline(parent, { position, rotationY = 0, span = 8 }) {
  const line = new THREE.Group();
  const postMaterial = makeStandardMaterial(0x8d6845, 0.9);
  const ropeMaterial = makeStandardMaterial(0xf4efe5, 0.75);
  const laundryColors = [0xf7efe5, 0xf3d2a2, 0xffb7ca, 0xbfd6ff];

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.4, 10), postMaterial);
    post.position.set(side * (span * 0.5), 1.7, 0);
    post.castShadow = true;
    line.add(post);
  }

  const rope = new THREE.Mesh(
    new THREE.BoxGeometry(span + 0.1, 0.04, 0.04),
    ropeMaterial,
  );
  rope.position.y = 3.02;
  line.add(rope);

  for (let index = 0; index < 5; index += 1) {
    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(0.58 + (index % 2) * 0.18, 0.72 + (index % 3) * 0.08, 0.06),
      makeStandardMaterial(laundryColors[index % laundryColors.length], 0.95),
    );
    cloth.position.set(-span * 0.32 + index * (span * 0.16), 2.56 - (index % 2) * 0.05, 0);
    cloth.rotation.z = (Math.random() - 0.5) * 0.18;
    cloth.castShadow = true;
    line.add(cloth);
  }

  line.position.set(...position);
  line.rotation.y = rotationY;
  parent.add(line);
}

function applyDressing(level, variantGroup) {
  const dressing = level.dressing ?? {};

  (dressing.trees ?? []).forEach((tree) => createTree(variantGroup, tree.position, tree.scale));
  (dressing.bushes ?? []).forEach((bush) => createBush(variantGroup, bush.position, bush.scale));
  (dressing.flowerPatches ?? []).forEach((patch) => createFlowerPatch(variantGroup, patch));
  (dressing.toyBones ?? []).forEach((bone) => createToyBone(variantGroup, bone));
  (dressing.laundryBaskets ?? []).forEach((basket) => createLaundryBasket(variantGroup, basket));
  (dressing.laundryPiles ?? []).forEach((pile) => createLaundryPile(variantGroup, pile));
  (dressing.lanterns ?? []).forEach((lantern) => createLantern(variantGroup, lantern));
  (dressing.fireflies ?? []).forEach((cloud) => createFireflyCloud(variantGroup, cloud));
  (dressing.clotheslines ?? []).forEach((line) => createClothesline(variantGroup, line));
}

export function buildEnvironment({ scene, worldSize }) {
  const baseGroup = new THREE.Group();
  baseGroup.name = "environment-base";
  const variantGroup = new THREE.Group();
  variantGroup.name = "environment-variant";
  scene.add(baseGroup, variantGroup);

  const lights = addLights(scene);
  const sky = addSkyDome(scene);
  const ground = createGround(baseGroup);
  createFence(baseGroup, worldSize);
  const house = createHouseAndPorch(baseGroup);

  return {
    applyLevel(level) {
      const mood = level.mood;
      scene.fog.color.setHex(mood.fogColor);
      lights.hemi.color.setHex(mood.hemiSkyColor);
      lights.hemi.groundColor.setHex(mood.hemiGroundColor);
      lights.hemi.intensity = mood.hemiIntensity;
      lights.sun.color.setHex(mood.sunColor);
      lights.sun.intensity = mood.sunIntensity;
      lights.sun.position.set(...mood.sunPosition);
      ground.groundMaterial.color.setHex(mood.groundColor);
      ground.pathMaterial.color.setHex(mood.pathColor);
      sky.uniforms.colorA.value.setHex(mood.skyTop);
      sky.uniforms.colorB.value.setHex(mood.skyBottom);

      house.windowPanes.forEach((pane) => {
        pane.material.color.setHex(mood.windowColor);
        pane.material.opacity = mood.windowOpacity;
        pane.material.emissive.setHex(mood.windowGlow);
        pane.material.emissiveIntensity = mood.windowGlowIntensity;
      });

      clearGroup(variantGroup);
      applyDressing(level, variantGroup);
    },
  };
}
