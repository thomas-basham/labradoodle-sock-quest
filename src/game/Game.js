import * as THREE from "three";

import { createFollowCamera, resizeFollowCamera, updateFollowCamera } from "../camera/followCamera";
import { createDog, nudgeDog, resetDog, triggerDogSniff, updateDog } from "../entities/dog";
import {
  createOwner,
  resetOwner,
  triggerOwnerCelebrate,
  triggerOwnerSockReaction,
  updateOwner,
} from "../entities/owner";
import { SockManager } from "../entities/sockManager";
import { registerKeyboardControls } from "../input/keyboard";
import { registerTouchControls } from "../input/touch";
import { createHud } from "../ui/hud";
import { createOverlay } from "../ui/overlay";
import { randomItem } from "../utils/math";
import { formatElapsedTime, loadStoredBestTime, saveStoredBestTime } from "../utils/time";
import { buildEnvironment } from "../world/environment";
import { HazardSystem } from "../world/hazardSystem";
import {
  DEFAULT_FLAVOR_MESSAGE,
  DOG_CONFIG,
  DOG_NAME,
  FLAVOR_MESSAGES,
  GAME_STATES,
  HAZARD_CONFIG,
  OBJECTIVES,
  OWNER_CELEBRATION_LINES,
  OWNER_REACTION_LINES,
  ROUND_CONFIG,
  SCENE_CONFIG,
  SNIFF_CONFIG,
  getReturningObjective,
  getSearchingObjective,
  getSniffHint,
} from "./config";
import {
  createDogState,
  createInputState,
  createPointerState,
  createTouchState,
  createWorldState,
} from "./state";

function createRenderer(mount) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  return renderer;
}

export class Game {
  constructor({ mount }) {
    this.mount = mount;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(
      SCENE_CONFIG.fogColor,
      SCENE_CONFIG.fogNear,
      SCENE_CONFIG.fogFar,
    );

    this.camera = createFollowCamera();
    this.renderer = createRenderer(mount);
    this.clock = new THREE.Clock();
    this.tempVector = new THREE.Vector3();
    this.previousDogPosition = new THREE.Vector3();

    this.worldState = createWorldState();
    this.pointerState = createPointerState();
    this.inputState = createInputState();
    this.touchState = createTouchState();

    buildEnvironment({ scene: this.scene, worldSize: this.worldState.size });

    this.owner = createOwner(this.scene);
    this.dog = createDog(this.scene);
    this.dogState = createDogState(this.dog);
    this.sockManager = new SockManager({
      scene: this.scene,
      dog: this.dog,
      owner: this.owner,
    });
    this.hazardSystem = new HazardSystem({
      scene: this.scene,
    });

    this.hud = createHud();
    this.overlay = createOverlay();
    this.sniffButton = document.getElementById("sniffButton");
    this.sniffCooldownEndsAt = 0;
    this.hud.setName(DOG_NAME);
    this.hud.setObjective(this.worldState.objective);
    this.hud.setProgress(this.worldState.socksReturned, this.worldState.totalSocks);
    this.hud.setRoundTime(formatElapsedTime(this.worldState.roundTimeMs));
    this.worldState.bestTimeMs = loadStoredBestTime(ROUND_CONFIG.bestTimeStorageKey);
    this.hud.setBestTime(formatElapsedTime(this.worldState.bestTimeMs));
    this.hud.setSniffHint(this.worldState.sniffHint);
    this.hud.setSniffCooldown(0, SNIFF_CONFIG.cooldownMs);
    this.hud.setFlavor(DEFAULT_FLAVOR_MESSAGE);
    this.hud.setHazardStatus(HAZARD_CONFIG.defaultStatus);
    this.hud.setSprinklerOverlay(0);
    this.overlay.showIntro();
    this.roundStartTime = null;

    this.handleOverlayAction = this.handleOverlayAction.bind(this);
    this.handleSniff = this.handleSniff.bind(this);
    this.tryStartGame = this.tryStartGame.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.render = this.render.bind(this);

    this.cleanups = [
      this.overlay.onAction(this.handleOverlayAction),
      registerKeyboardControls({
        inputState: this.inputState,
        onStart: this.tryStartGame,
        onSniff: this.handleSniff,
      }),
      registerTouchControls({
        canvas: this.renderer.domElement,
        movePad: document.getElementById("movePad"),
        moveKnob: document.getElementById("moveKnob"),
        sniffButton: this.sniffButton,
        sprintButton: document.getElementById("sprintButton"),
        inputState: this.inputState,
        onSniff: this.handleSniff,
        pointerState: this.pointerState,
        touchState: this.touchState,
      }),
    ];

    window.addEventListener("resize", this.handleResize);
    this.animationFrameId = null;
    this.updateSniffUi();
  }

  start() {
    this.render();
  }

  destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener("resize", this.handleResize);
    this.cleanups.forEach((cleanup) => cleanup());
    this.renderer.dispose();
  }

  handleResize() {
    resizeFollowCamera(this.camera);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setObjective(text) {
    this.worldState.objective = text;
    this.hud.setObjective(text);
  }

  setSocksReturned(count) {
    this.worldState.socksReturned = count;
    this.hud.setProgress(count, this.worldState.totalSocks);
  }

  setRoundTime(milliseconds) {
    this.worldState.roundTimeMs = milliseconds;
    this.hud.setRoundTime(formatElapsedTime(milliseconds));
  }

  setBestTime(milliseconds) {
    this.worldState.bestTimeMs = milliseconds;
    this.hud.setBestTime(formatElapsedTime(milliseconds));
  }

  setSniffHint(text) {
    this.worldState.sniffHint = text;
    this.hud.setSniffHint(text);
  }

  setFlavor(text) {
    this.worldState.flavorText = text;
    this.hud.setFlavor(text);
  }

  setHazardStatus(status) {
    this.worldState.hazardBadge = status.badge;
    this.worldState.hazardTitle = status.title;
    this.worldState.hazardDetail = status.detail;
    this.hud.setHazardStatus(status);
  }

  setSprinklerOverlay(intensity) {
    this.worldState.sprinklerOverlay = intensity;
    this.hud.setSprinklerOverlay(intensity);
  }

  applyHazardFeedback(feedback) {
    this.setHazardStatus({
      badge: feedback.badge,
      title: feedback.title,
      detail: feedback.detail,
    });
    this.setSprinklerOverlay(feedback.sprinklerOverlay);

    if (feedback.impulse) {
      nudgeDog(this.dogState, feedback.impulse);
    }
  }

  getSniffCooldownRemaining(now = performance.now()) {
    return Math.max(0, this.sniffCooldownEndsAt - now);
  }

  updateSniffUi(now = performance.now()) {
    const remainingMs = this.getSniffCooldownRemaining(now);
    const sniffAvailable =
      this.worldState.gameStarted &&
      this.worldState.state === GAME_STATES.searching &&
      remainingMs === 0;

    this.hud.setSniffCooldown(remainingMs, SNIFF_CONFIG.cooldownMs);

    if (this.sniffButton) {
      this.sniffButton.disabled = !sniffAvailable;
    }
  }

  getRandomFlavor() {
    let flavor = randomItem(FLAVOR_MESSAGES);

    if (FLAVOR_MESSAGES.length > 1) {
      while (flavor === this.worldState.flavorText) {
        flavor = randomItem(FLAVOR_MESSAGES);
      }
    }

    return flavor;
  }

  tryStartGame() {
    if (this.worldState.gameStarted) return;
    if (this.worldState.state === GAME_STATES.complete) {
      this.resetRound();
      return;
    }
    this.startRound();
  }

  handleOverlayAction() {
    if (this.worldState.state === GAME_STATES.complete) {
      this.resetRound();
      return;
    }

    this.startRound();
  }

  startRound() {
    resetDog(this.dog, this.dogState);
    resetOwner(this.owner);
    this.sockManager.resetRound();
    this.hazardSystem.resetRound({
      reservedPositions: [
        ...this.sockManager.getRoundSockPositions(),
        this.owner.position.clone(),
        new THREE.Vector3(...DOG_CONFIG.spawn),
      ],
    });
    this.worldState.gameStarted = true;
    this.worldState.state = GAME_STATES.searching;
    this.dogState.hasSock = false;
    this.sniffCooldownEndsAt = 0;
    this.roundStartTime = performance.now();
    this.overlay.hide();
    this.setSocksReturned(0);
    this.setRoundTime(0);
    this.setObjective(getSearchingObjective(0, this.worldState.totalSocks));
    this.setSniffHint(SNIFF_CONFIG.defaultHint);
    this.setFlavor(this.getRandomFlavor());
    this.setHazardStatus(HAZARD_CONFIG.defaultStatus);
    this.setSprinklerOverlay(0);
    this.updateSniffUi(this.roundStartTime);
  }

  completeRound() {
    const totalTime = performance.now() - this.roundStartTime;
    const previousBest = this.worldState.bestTimeMs;
    const isNewBest = previousBest === null || totalTime < previousBest;

    triggerOwnerCelebrate(this.owner, randomItem(OWNER_CELEBRATION_LINES));
    this.worldState.state = GAME_STATES.complete;
    this.worldState.gameStarted = false;
    this.sniffCooldownEndsAt = 0;
    this.setRoundTime(totalTime);
    this.setObjective(OBJECTIVES.complete);
    this.setSniffHint(SNIFF_CONFIG.completeHint);
    this.sockManager.hideMarkers();

    const bestTime = isNewBest ? totalTime : previousBest;
    if (isNewBest) {
      saveStoredBestTime(ROUND_CONFIG.bestTimeStorageKey, totalTime);
    }
    this.setBestTime(bestTime);

    this.overlay.showRoundComplete({
      totalTimeText: formatElapsedTime(totalTime),
      bestTimeText: formatElapsedTime(bestTime),
      isNewBest,
    });
    this.updateSniffUi();
  }

  resetRound() {
    this.startRound();
  }

  pickupSock() {
    this.dogState.hasSock = true;
    this.setObjective(
      getReturningObjective(this.worldState.socksReturned, this.worldState.totalSocks),
    );
    this.setSniffHint(SNIFF_CONFIG.returningHint);
    this.setFlavor(this.getRandomFlavor());
    this.updateSniffUi();
  }

  handleSniff() {
    const now = performance.now();
    if (!this.worldState.gameStarted || this.worldState.state !== GAME_STATES.searching) {
      return;
    }

    if (this.getSniffCooldownRemaining(now) > 0) {
      return;
    }

    const target = this.sockManager.getActiveSockWorldPosition(this.tempVector);
    if (!target || !this.sockManager.activateSniff()) {
      return;
    }

    triggerDogSniff(this.dogState);
    this.sniffCooldownEndsAt = now + SNIFF_CONFIG.cooldownMs;
    this.setSniffHint(getSniffHint(this.dog.position.distanceTo(target)));
    this.updateSniffUi(now);
  }

  checkObjectives() {
    if (this.worldState.state === GAME_STATES.searching) {
      if (this.sockManager.tryPickup(this.dog.position)) {
        this.worldState.state = GAME_STATES.returning;
        this.pickupSock();
      }
      return;
    }

    if (this.worldState.state !== GAME_STATES.returning) {
      return;
    }

    const result = this.sockManager.tryReturn(this.dog.position, this.tempVector);
    if (result.returned) {
      this.dogState.hasSock = false;
      this.setSocksReturned(result.returnedCount);

      if (result.roundComplete) {
        this.completeRound();
        return;
      }

      triggerOwnerSockReaction(this.owner, randomItem(OWNER_REACTION_LINES));
      this.worldState.state = GAME_STATES.searching;
      this.setObjective(
        getSearchingObjective(this.worldState.socksReturned, this.worldState.totalSocks),
      );
      this.setSniffHint(SNIFF_CONFIG.defaultHint);
      this.updateSniffUi();
    }
  }

  updateRoundTimer() {
    if (!this.worldState.gameStarted || this.roundStartTime === null) {
      return;
    }

    this.setRoundTime(performance.now() - this.roundStartTime);
  }

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    const now = performance.now();
    const speedMultiplier = this.worldState.gameStarted
      ? this.hazardSystem.getSpeedMultiplier(this.dogState.position)
      : 1;
    this.previousDogPosition.copy(this.dog.position);

    updateDog({
      dog: this.dog,
      dogState: this.dogState,
      inputState: this.inputState,
      pointerState: this.pointerState,
      worldState: this.worldState,
      delta,
      speedMultiplier,
      resolveMovement: (currentPosition, proposedPosition) =>
        this.hazardSystem.resolveMovement({
          currentPosition,
          proposedPosition,
          now,
        }),
    });

    this.applyHazardFeedback(
      this.hazardSystem.update({
        dogPosition: this.dog.position,
        previousDogPosition: this.previousDogPosition,
        delta,
        elapsed,
        now,
        gameStarted: this.worldState.gameStarted,
      }),
    );
    updateOwner(this.owner, delta, elapsed);

    this.updateRoundTimer();

    updateFollowCamera({
      camera: this.camera,
      target: this.dog.position,
      pointerState: this.pointerState,
      delta,
    });

    this.sockManager.updateMarkers({
      elapsed,
      gameStarted: this.worldState.gameStarted,
    });
    this.sockManager.updateSniffEffects({
      delta,
      elapsed,
      gameStarted: this.worldState.gameStarted,
    });
    this.updateSniffUi();

    this.checkObjectives();
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.render);
  }
}
