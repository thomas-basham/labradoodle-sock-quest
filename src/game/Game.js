import * as THREE from "three";

import { createFollowCamera, resizeFollowCamera, updateFollowCamera } from "../camera/followCamera";
import { createDog, resetDog, updateDog } from "../entities/dog";
import { createOwner } from "../entities/owner";
import { SockManager } from "../entities/sockManager";
import { registerKeyboardControls } from "../input/keyboard";
import { registerTouchControls } from "../input/touch";
import { createHud } from "../ui/hud";
import { createOverlay } from "../ui/overlay";
import { randomItem } from "../utils/math";
import { formatElapsedTime, loadStoredBestTime, saveStoredBestTime } from "../utils/time";
import { buildEnvironment } from "../world/environment";
import {
  DEFAULT_FLAVOR_MESSAGE,
  DOG_CONFIG,
  DOG_NAME,
  FLAVOR_MESSAGES,
  GAME_STATES,
  OBJECTIVES,
  ROUND_CONFIG,
  SCENE_CONFIG,
  getReturningObjective,
  getSearchingObjective,
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

    this.hud = createHud();
    this.overlay = createOverlay();
    this.hud.setName(DOG_NAME);
    this.hud.setObjective(this.worldState.objective);
    this.hud.setProgress(this.worldState.socksReturned, this.worldState.totalSocks);
    this.hud.setRoundTime(formatElapsedTime(this.worldState.roundTimeMs));
    this.worldState.bestTimeMs = loadStoredBestTime(ROUND_CONFIG.bestTimeStorageKey);
    this.hud.setBestTime(formatElapsedTime(this.worldState.bestTimeMs));
    this.hud.setFlavor(DEFAULT_FLAVOR_MESSAGE);
    this.overlay.showIntro();
    this.roundStartTime = null;

    this.handleOverlayAction = this.handleOverlayAction.bind(this);
    this.tryStartGame = this.tryStartGame.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.render = this.render.bind(this);

    this.cleanups = [
      this.overlay.onAction(this.handleOverlayAction),
      registerKeyboardControls({
        inputState: this.inputState,
        onStart: this.tryStartGame,
      }),
      registerTouchControls({
        canvas: this.renderer.domElement,
        movePad: document.getElementById("movePad"),
        moveKnob: document.getElementById("moveKnob"),
        sprintButton: document.getElementById("sprintButton"),
        inputState: this.inputState,
        pointerState: this.pointerState,
        touchState: this.touchState,
      }),
    ];

    window.addEventListener("resize", this.handleResize);
    this.animationFrameId = null;
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

  setFlavor(text) {
    this.worldState.flavorText = text;
    this.hud.setFlavor(text);
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
    this.sockManager.resetRound();
    this.worldState.gameStarted = true;
    this.worldState.state = GAME_STATES.searching;
    this.dogState.hasSock = false;
    this.roundStartTime = performance.now();
    this.overlay.hide();
    this.setSocksReturned(0);
    this.setRoundTime(0);
    this.setObjective(getSearchingObjective(0, this.worldState.totalSocks));
    this.setFlavor(this.getRandomFlavor());
  }

  completeRound() {
    const totalTime = performance.now() - this.roundStartTime;
    const previousBest = this.worldState.bestTimeMs;
    const isNewBest = previousBest === null || totalTime < previousBest;

    this.worldState.state = GAME_STATES.complete;
    this.worldState.gameStarted = false;
    this.setRoundTime(totalTime);
    this.setObjective(OBJECTIVES.complete);
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
  }

  resetRound() {
    this.startRound();
  }

  pickupSock() {
    this.dogState.hasSock = true;
    this.setObjective(
      getReturningObjective(this.worldState.socksReturned, this.worldState.totalSocks),
    );
    this.setFlavor(this.getRandomFlavor());
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

      this.worldState.state = GAME_STATES.searching;
      this.setObjective(
        getSearchingObjective(this.worldState.socksReturned, this.worldState.totalSocks),
      );
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

    updateDog({
      dog: this.dog,
      dogState: this.dogState,
      inputState: this.inputState,
      pointerState: this.pointerState,
      worldState: this.worldState,
      delta,
    });

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

    this.checkObjectives();
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.render);
  }
}
