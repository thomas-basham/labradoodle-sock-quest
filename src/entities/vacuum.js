import * as THREE from "three";

import { PALETTE, VACUUM_CONFIG } from "../game/config";

const directionVector = new THREE.Vector3();
const targetVector = new THREE.Vector3();
const bumpVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

function lerpRadians(current, target, alpha) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * alpha;
}

function makeMaterial(color, roughness = 0.7, metalness = 0.12) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function createAlertIcon(material) {
  const icon = new THREE.Group();

  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.54, 0.08), material);
  stem.position.y = 0.28;
  icon.add(stem);

  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), material);
  dot.position.y = -0.06;
  icon.add(dot);

  return icon;
}

function createVacuumMesh(scene) {
  const vacuum = new THREE.Group();
  const shellMaterial = makeMaterial(PALETTE.vacuumShell, 0.92, 0.05);
  const trimMaterial = makeMaterial(PALETTE.vacuumTrim, 0.55, 0.26);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: PALETTE.vacuumGlow,
    transparent: true,
    opacity: 0.85,
  });
  const alertMaterial = new THREE.MeshBasicMaterial({
    color: PALETTE.vacuumAlert,
    transparent: true,
    opacity: 0,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 1.04, 0.34, 32), trimMaterial);
  base.castShadow = true;
  base.receiveShadow = true;
  vacuum.add(base);

  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.9, 0.24, 32), shellMaterial);
  shell.position.y = 0.17;
  shell.castShadow = true;
  vacuum.add(shell);

  const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.1, 24), shellMaterial);
  dome.position.y = 0.34;
  dome.castShadow = true;
  vacuum.add(dome);

  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 12, 28), glowMaterial);
  eye.rotation.x = Math.PI / 2;
  eye.position.y = 0.31;
  vacuum.add(eye);

  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 18), trimMaterial);
  button.position.set(-0.18, 0.33, 0);
  vacuum.add(button);

  const brushGeometry = new THREE.BoxGeometry(0.56, 0.03, 0.06);
  for (const angle of [0.5, 2.64, 4.78]) {
    const brush = new THREE.Mesh(brushGeometry, trimMaterial);
    brush.position.set(Math.cos(angle) * 0.82, -0.12, Math.sin(angle) * 0.82);
    brush.rotation.y = angle;
    vacuum.add(brush);
  }

  const alertRing = new THREE.Mesh(
    new THREE.RingGeometry(0.78, 1.04, 28),
    new THREE.MeshBasicMaterial({
      color: PALETTE.vacuumAlert,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  alertRing.rotation.x = -Math.PI / 2;
  alertRing.position.y = 0.03;
  vacuum.add(alertRing);

  const alertIcon = createAlertIcon(alertMaterial);
  alertIcon.position.y = 1.42;
  alertIcon.visible = false;
  vacuum.add(alertIcon);

  vacuum.visible = false;
  vacuum.position.y = VACUUM_CONFIG.hoverHeight;
  vacuum.userData = {
    eye,
    eyeMaterial: glowMaterial,
    alertRing,
    alertIcon,
    alertMaterial,
  };
  scene.add(vacuum);
  return vacuum;
}

export class VacuumEnemy {
  constructor({ scene }) {
    this.scene = scene;
    this.vacuum = createVacuumMesh(scene);
    this.enabled = false;
    this.pathPoints = [];
    this.currentPathIndex = 0;
    this.state = "idle";
    this.chaseEndsAt = 0;
    this.bumpCooldownEndsAt = 0;
    this.alertEndsAt = 0;
  }

  resetRound({ enabled = false, patrolPoints = [] } = {}) {
    this.pathPoints = patrolPoints.map(([x, , z]) => new THREE.Vector3(x, 0, z));
    this.currentPathIndex = 0;
    this.state = "idle";
    this.chaseEndsAt = 0;
    this.bumpCooldownEndsAt = 0;
    this.alertEndsAt = 0;
    this.vacuum.visible = false;

    if (this.pathPoints.length === 0) {
      this.enabled = false;
      this.updateVisuals({ elapsed: 0, alerting: false });
      return;
    }

    const startPoint = this.pathPoints[0];
    this.vacuum.position.set(startPoint.x, VACUUM_CONFIG.hoverHeight, startPoint.z);
    this.vacuum.rotation.set(0, 0, 0);
    this.setEnabled(enabled);
  }

  setEnabled(enabled) {
    this.enabled = enabled && this.pathPoints.length > 0;
    this.vacuum.visible = this.enabled;

    if (!this.enabled) {
      this.state = "idle";
      this.chaseEndsAt = 0;
      this.alertEndsAt = 0;
      this.updateVisuals({ elapsed: 0, alerting: false });
      return;
    }

    if (this.state === "idle") {
      this.state = "patrol";
    }
  }

  shiftTimers(pauseDurationMs) {
    if (this.chaseEndsAt > 0) {
      this.chaseEndsAt += pauseDurationMs;
    }

    if (this.bumpCooldownEndsAt > 0) {
      this.bumpCooldownEndsAt += pauseDurationMs;
    }

    if (this.alertEndsAt > 0) {
      this.alertEndsAt += pauseDurationMs;
    }
  }

  update({ delta, elapsed, now, gameStarted, dogPosition, carryingSock }) {
    if (!this.enabled || !gameStarted || this.pathPoints.length === 0) {
      this.updateVisuals({ elapsed, alerting: false });
      return {
        spotted: false,
        bumped: false,
        droppedSock: false,
        status: null,
        impulse: null,
      };
    }

    const distanceToDog = this.vacuum.position.distanceTo(dogPosition);
    let spotted = false;
    let bumped = false;
    let impulse = null;

    if (this.state !== "chase" && distanceToDog <= VACUUM_CONFIG.detectionRadius) {
      this.state = "chase";
      this.chaseEndsAt = now + VACUUM_CONFIG.chaseDurationMs;
      this.alertEndsAt = now + VACUUM_CONFIG.alertHoldMs;
      spotted = true;
    }

    if (this.state === "chase" && now >= this.chaseEndsAt) {
      this.state = "patrol";
    }

    if (this.state === "chase") {
      targetVector.set(dogPosition.x, VACUUM_CONFIG.hoverHeight, dogPosition.z);
    } else {
      const patrolTarget = this.pathPoints[this.currentPathIndex];
      targetVector.set(patrolTarget.x, VACUUM_CONFIG.hoverHeight, patrolTarget.z);

      if (this.vacuum.position.distanceToSquared(targetVector) <= 0.7 * 0.7) {
        this.currentPathIndex = (this.currentPathIndex + 1) % this.pathPoints.length;
      }
    }

    directionVector.copy(targetVector).sub(this.vacuum.position);
    directionVector.y = 0;

    if (directionVector.lengthSq() > 0.0001) {
      directionVector.normalize();
      const speed =
        this.state === "chase" ? VACUUM_CONFIG.chaseSpeed : VACUUM_CONFIG.patrolSpeed;
      this.vacuum.position.addScaledVector(directionVector, speed * delta);

      const desiredYaw = Math.atan2(directionVector.x, directionVector.z);
      this.vacuum.rotation.y = lerpRadians(this.vacuum.rotation.y, desiredYaw, Math.min(1, delta * 8));
    }

    if (distanceToDog <= VACUUM_CONFIG.bumpDistance && now >= this.bumpCooldownEndsAt) {
      bumpVector.copy(dogPosition).sub(this.vacuum.position);
      bumpVector.y = 0;
      if (bumpVector.lengthSq() === 0) {
        bumpVector.set(0, 0, 1).applyAxisAngle(upVector, this.vacuum.rotation.y);
      } else {
        bumpVector.normalize();
      }

      impulse = bumpVector.multiplyScalar(VACUUM_CONFIG.bumpStrength);
      bumped = true;
      this.state = "chase";
      this.chaseEndsAt = now + VACUUM_CONFIG.chaseDurationMs * 0.65;
      this.bumpCooldownEndsAt = now + VACUUM_CONFIG.bumpCooldownMs;
      this.alertEndsAt = now + VACUUM_CONFIG.alertHoldMs;
    }

    const alerting = this.state === "chase" || now < this.alertEndsAt;
    this.updateVisuals({ elapsed, alerting });

    return {
      spotted,
      bumped,
      droppedSock: bumped && carryingSock,
      status: alerting
        ? bumped
          ? VACUUM_CONFIG.bumpStatus
          : VACUUM_CONFIG.chaseStatus
        : null,
      impulse,
    };
  }

  updateVisuals({ elapsed, alerting }) {
    const hover = Math.sin(elapsed * 3.1) * 0.035;
    this.vacuum.position.y = VACUUM_CONFIG.hoverHeight + hover;

    const eyeMaterial = this.vacuum.userData.eyeMaterial;
    const alertRing = this.vacuum.userData.alertRing;
    const alertIcon = this.vacuum.userData.alertIcon;
    const alertMaterial = this.vacuum.userData.alertMaterial;

    eyeMaterial.color.setHex(alerting ? PALETTE.vacuumAlert : PALETTE.vacuumGlow);
    alertIcon.visible = alerting;
    alertRing.material.opacity = alerting ? 0.26 + Math.sin(elapsed * 9) * 0.08 : 0;
    alertRing.scale.setScalar(alerting ? 1 + Math.sin(elapsed * 7) * 0.08 : 1);
    alertMaterial.opacity = alerting ? 0.78 + Math.sin(elapsed * 11) * 0.12 : 0;
    alertIcon.position.y = 1.42 + Math.abs(Math.sin(elapsed * 5)) * 0.12;
  }
}
