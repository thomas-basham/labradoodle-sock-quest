import * as THREE from "three";

import { OWNER_CONFIG, OWNER_NAME, PALETTE } from "../game/config";

function makeStandardMaterial(color, roughness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
  });
}

function createComplimentSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.visible = false;
  sprite.scale.set(5.8, 1.8, 1);

  return {
    canvas,
    context,
    texture,
    sprite,
  };
}

function drawRoundedPanel(context, width, height, radius) {
  context.beginPath();
  context.moveTo(radius, 12);
  context.lineTo(width - radius, 12);
  context.quadraticCurveTo(width, 12, width, 12 + radius);
  context.lineTo(width, height - radius);
  context.quadraticCurveTo(width, height, width - radius, height);
  context.lineTo(radius, height);
  context.quadraticCurveTo(0, height, 0, height - radius);
  context.lineTo(0, 12 + radius);
  context.quadraticCurveTo(0, 12, radius, 12);
  context.closePath();
}

function drawComplimentText(textData, text) {
  const { canvas, context, texture } = textData;
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawRoundedPanel(context, canvas.width, canvas.height - 12, 42);
  context.fillStyle = "rgba(255, 249, 232, 0.92)";
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = "rgba(141, 75, 28, 0.32)";
  context.stroke();

  context.fillStyle = "#5f3818";
  context.textAlign = "center";
  context.textBaseline = "middle";
  let fontSize = 54;
  context.font = `800 ${fontSize}px 'Trebuchet MS', sans-serif`;

  while (fontSize > 34 && context.measureText(text).width > canvas.width - 80) {
    fontSize -= 2;
    context.font = `800 ${fontSize}px 'Trebuchet MS', sans-serif`;
  }

  context.fillText(text, canvas.width / 2, canvas.height / 2 + 4, canvas.width - 52);

  texture.needsUpdate = true;
}

function showCompliment(owner, text, scaleMultiplier, duration) {
  const textData = owner.userData.complimentText;
  drawComplimentText(textData, text);
  textData.sprite.visible = true;
  textData.sprite.material.opacity = 1;
  textData.baseScale = 5.8 * scaleMultiplier;
  textData.sprite.scale.set(textData.baseScale, 1.8 * scaleMultiplier, 1);
  owner.userData.complimentTimer = duration;
  owner.userData.complimentDuration = duration;
}

function createHamper() {
  const hamper = new THREE.Group();
  const basketMaterial = makeStandardMaterial(0xcaa271, 0.9);
  const trimMaterial = makeStandardMaterial(0xa67f52, 0.88);
  const clothColors = [0xf3d2a2, 0xffb2c7, PALETTE.sock, PALETTE.sockStripe];

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.04, 1.08, 18, 1, true),
    basketMaterial,
  );
  shell.position.y = 0.58;
  shell.castShadow = true;
  shell.receiveShadow = true;
  hamper.add(shell);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.88, 0.16, 18), trimMaterial);
  base.position.y = 0.08;
  base.castShadow = true;
  hamper.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.07, 12, 28), trimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.08;
  rim.castShadow = true;
  hamper.add(rim);

  for (let index = 0; index < 3; index += 1) {
    const cloth = new THREE.Mesh(
      new THREE.SphereGeometry(0.2 + index * 0.04, 14, 14),
      makeStandardMaterial(clothColors[index % clothColors.length], 0.92),
    );
    cloth.position.set(-0.18 + index * 0.18, 0.88 + (index % 2) * 0.08, 0.12 - index * 0.06);
    cloth.castShadow = true;
    hamper.add(cloth);
  }

  hamper.position.set(-2.05, -0.48, -0.18);

  const targetData = [
    { position: [0.02, 0.74, 0.08], rotation: [Math.PI / 2, -0.08, 0.18] },
    { position: [0.26, 0.84, -0.04], rotation: [Math.PI / 2, 0.38, -0.05] },
    { position: [-0.24, 0.8, 0.02], rotation: [Math.PI / 2, -0.42, 0.12] },
    { position: [0.08, 0.96, 0.18], rotation: [Math.PI / 2, 0.16, 0.26] },
    { position: [-0.08, 0.9, -0.16], rotation: [Math.PI / 2, -0.22, -0.18] },
  ];

  const sockRestTargets = targetData.map((target) => {
    const anchor = new THREE.Object3D();
    anchor.position.set(...target.position);
    anchor.rotation.set(...target.rotation);
    hamper.add(anchor);
    return anchor;
  });

  return { hamper, sockRestTargets };
}

export function createOwner(scene) {
  const owner = new THREE.Group();
  const bodyRig = new THREE.Group();
  owner.add(bodyRig);

  const skin = makeStandardMaterial(0xf1caab, 0.75);
  const shirt = makeStandardMaterial(PALETTE.ownerShirt, 0.82);
  const jeans = makeStandardMaterial(PALETTE.ownerJeans, 0.9);
  const hair = makeStandardMaterial(0x423022, 0.98);
  const shoes = makeStandardMaterial(0xffffff, 0.6);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 1.6, 6, 12), shirt);
  torso.position.y = 2.8;
  torso.castShadow = true;
  bodyRig.add(torso);

  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 12), shirt);
  hips.position.y = 1.9;
  hips.castShadow = true;
  bodyRig.add(hips);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 16), skin);
  head.position.set(0, 4.3, 0);
  head.castShadow = true;
  bodyRig.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.64, 16, 16), hair);
  hairCap.position.set(0, 4.48, -0.04);
  hairCap.scale.set(1.03, 0.8, 1.04);
  hairCap.castShadow = true;
  bodyRig.add(hairCap);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.72, 3.35, 0);
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.72, 3.35, 0);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.15, 4, 10), shirt);
  leftArm.position.set(0, -0.62, 0);
  leftArm.castShadow = true;

  const rightArm = leftArm.clone();
  rightArm.castShadow = true;

  leftArmPivot.add(leftArm);
  rightArmPivot.add(rightArm);
  bodyRig.add(leftArmPivot, rightArmPivot);

  for (const x of [-0.28, 0.28]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.4, 4, 10), jeans);
    leg.position.set(x, 1.0, 0);
    leg.castShadow = true;
    bodyRig.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.8), shoes);
    shoe.position.set(x, 0.08, 0.15);
    shoe.castShadow = true;
    bodyRig.add(shoe);
  }

  const complimentText = createComplimentSprite();
  complimentText.sprite.position.set(0, OWNER_CONFIG.complimentHeight, 0);
  owner.add(complimentText.sprite);

  const { hamper, sockRestTargets } = createHamper();
  owner.add(hamper);

  owner.position.set(...OWNER_CONFIG.position);
  owner.rotation.y = Math.PI;
  owner.userData = {
    name: OWNER_NAME,
    bodyRig,
    head,
    hairCap,
    leftArmPivot,
    rightArmPivot,
    baseLeftArmRotation: 0.24,
    baseRightArmRotation: -0.24,
    complimentText,
    hamper,
    sockRestTargets,
    complimentTimer: 0,
    complimentDuration: OWNER_CONFIG.complimentDuration,
    celebrationTimer: 0,
    happyTimer: 0,
  };

  resetOwner(owner);
  scene.add(owner);
  return owner;
}

export function resetOwner(owner) {
  owner.userData.bodyRig.position.set(0, 0, 0);
  owner.userData.bodyRig.rotation.set(0, 0, 0);
  owner.userData.head.rotation.set(0, 0, 0);
  owner.userData.hairCap.rotation.set(0, 0, 0);
  owner.userData.leftArmPivot.rotation.set(0, 0, owner.userData.baseLeftArmRotation);
  owner.userData.rightArmPivot.rotation.set(0, 0, owner.userData.baseRightArmRotation);
  owner.userData.hamper.rotation.set(0, 0, 0);
  owner.userData.complimentText.sprite.visible = false;
  owner.userData.complimentText.sprite.material.opacity = 0;
  owner.userData.complimentTimer = 0;
  owner.userData.happyTimer = 0;
  owner.userData.celebrationTimer = 0;
}

export function triggerOwnerSockReaction(owner, text) {
  owner.userData.happyTimer = OWNER_CONFIG.happyReactionDuration;
  owner.userData.celebrationTimer = 0;
  showCompliment(owner, text, 1, OWNER_CONFIG.complimentDuration);
}

export function triggerOwnerCelebrate(owner, text) {
  owner.userData.celebrationTimer = OWNER_CONFIG.celebrationDuration;
  owner.userData.happyTimer = 0;
  showCompliment(owner, text, 1.1, OWNER_CONFIG.complimentDuration + 0.35);
}

export function updateOwner(owner, delta, elapsed) {
  const data = owner.userData;
  const sprite = data.complimentText.sprite;

  data.happyTimer = Math.max(0, data.happyTimer - delta);
  data.celebrationTimer = Math.max(0, data.celebrationTimer - delta);
  data.complimentTimer = Math.max(0, data.complimentTimer - delta);

  const idleBob = Math.sin(elapsed * OWNER_CONFIG.idleBobSpeed) * OWNER_CONFIG.idleBobHeight;
  let bodyBob = idleBob;
  let bodyYaw = Math.sin(elapsed * OWNER_CONFIG.idleBobSpeed * 0.8) * OWNER_CONFIG.idleSwayAmount;
  let headTilt = Math.sin(elapsed * 1.05) * 0.05;
  let headNod = Math.sin(elapsed * 1.45) * 0.03;
  let leftArmRotation = data.baseLeftArmRotation + Math.sin(elapsed * 1.3) * 0.05;
  let rightArmRotation = data.baseRightArmRotation - Math.sin(elapsed * 1.3) * 0.05;

  if (data.celebrationTimer > 0) {
    bodyBob += Math.abs(Math.sin(elapsed * 7.4)) * 0.18;
    bodyYaw = Math.sin(elapsed * 6.2) * 0.14;
    headTilt = Math.sin(elapsed * 5.7) * 0.12;
    headNod = -0.12 + Math.abs(Math.sin(elapsed * 7.8)) * 0.08;
    leftArmRotation = data.baseLeftArmRotation + 1.08 + Math.sin(elapsed * 11) * 0.2;
    rightArmRotation = data.baseRightArmRotation - 1.08 - Math.sin(elapsed * 11) * 0.2;
  } else if (data.happyTimer > 0) {
    bodyBob += Math.abs(Math.sin(elapsed * 5.5)) * 0.1;
    bodyYaw = Math.sin(elapsed * 4.4) * 0.08;
    headTilt = Math.sin(elapsed * 3.8) * 0.08;
    headNod = -0.06 + Math.abs(Math.sin(elapsed * 6.1)) * 0.04;
    leftArmRotation = data.baseLeftArmRotation + 0.62 + Math.sin(elapsed * 8.4) * 0.14;
    rightArmRotation = data.baseRightArmRotation - 0.62 - Math.sin(elapsed * 8.4) * 0.14;
  }

  data.bodyRig.position.y = bodyBob;
  data.bodyRig.rotation.y = bodyYaw;
  data.hamper.rotation.z = data.celebrationTimer > 0 ? Math.sin(elapsed * 6.2) * 0.04 : 0;
  data.head.rotation.x = headNod;
  data.head.rotation.z = headTilt;
  data.hairCap.rotation.z = headTilt * 0.65;
  data.leftArmPivot.rotation.z = leftArmRotation;
  data.rightArmPivot.rotation.z = rightArmRotation;

  if (data.complimentTimer > 0) {
    const progress = 1 - data.complimentTimer / data.complimentDuration;
    const fade =
      progress > 0.74 ? Math.max(0, 1 - (progress - 0.74) / 0.26) : 1;

    sprite.visible = true;
    sprite.material.opacity = fade;
    sprite.position.y = OWNER_CONFIG.complimentHeight + progress * 0.5;
    sprite.scale.set(
      data.complimentText.baseScale * (1 + progress * 0.04),
      1.8 * (data.complimentText.baseScale / 5.8) * (1 + progress * 0.04),
      1,
    );
  } else {
    sprite.visible = false;
    sprite.material.opacity = 0;
    sprite.position.y = OWNER_CONFIG.complimentHeight;
  }
}
