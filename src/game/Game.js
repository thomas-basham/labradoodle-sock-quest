import * as THREE from "three";

import { createFollowCamera, resizeFollowCamera, updateFollowCamera } from "../camera/followCamera";
import { createDog, resetDog, updateDog } from "../entities/dog";
import { createOwner } from "../entities/owner";
import {
  attachSockToDog,
  createObjectiveMarkers,
  createSock,
  placeSockByOwner,
  resetSock,
  updateObjectiveMarkers,
} from "../entities/sock";
import { registerKeyboardControls } from "../input/keyboard";
import { registerTouchControls } from "../input/touch";
import { createHud } from "../ui/hud";
import { createOverlay } from "../ui/overlay";
import { buildEnvironment } from "../world/environment";
import { DOG_CONFIG, GAME_STATES, OBJECTIVES, SCENE_CONFIG } from "./config";
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
    this.sock = createSock(this.scene);
    this.dog = createDog(this.scene);
    this.dogState = createDogState(this.dog);

    const markers = createObjectiveMarkers(this.scene);
    this.sockMarker = markers.sockMarker;
    this.ownerMarker = markers.ownerMarker;

    this.hud = createHud();
    this.overlay = createOverlay();
    this.hud.setObjective(this.worldState.objective);
    this.overlay.showIntro();

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

  tryStartGame() {
    if (this.worldState.gameStarted) return;
    if (this.worldState.state === GAME_STATES.complete) return;
    this.startGame();
  }

  handleOverlayAction() {
    if (this.worldState.state === GAME_STATES.complete) {
      this.resetGame();
      return;
    }

    this.startGame();
  }

  startGame() {
    this.worldState.gameStarted = true;
    this.worldState.state = GAME_STATES.searching;
    this.overlay.hide();
    this.setObjective(OBJECTIVES.searching);
    this.sockMarker.visible = true;
    this.ownerMarker.visible = false;
  }

  winGame() {
    this.worldState.state = GAME_STATES.complete;
    this.worldState.gameStarted = false;
    this.overlay.showWin();
    this.setObjective(OBJECTIVES.complete);
    this.sockMarker.visible = false;
    this.ownerMarker.visible = false;
  }

  resetGame() {
    resetSock({ sock: this.sock, scene: this.scene });
    resetDog(this.dog, this.dogState);
    this.overlay.showIntro();
    this.startGame();
  }

  pickupSock() {
    this.dogState.hasSock = true;
    attachSockToDog({ sock: this.sock, dog: this.dog });
    this.setObjective(OBJECTIVES.returning);
  }

  checkObjectives() {
    if (this.worldState.state === GAME_STATES.searching) {
      const distanceToSock = this.dog.position.distanceTo(this.sock.position);
      if (distanceToSock < DOG_CONFIG.pickupDistance) {
        this.worldState.state = GAME_STATES.returning;
        this.pickupSock();
      }
      return;
    }

    if (this.worldState.state !== GAME_STATES.returning) {
      return;
    }

    const ownerPosition = this.owner.getWorldPosition(this.tempVector);
    const distanceToOwner = this.dog.position.distanceTo(ownerPosition);
    if (distanceToOwner < DOG_CONFIG.returnDistance) {
      placeSockByOwner({
        sock: this.sock,
        scene: this.scene,
        owner: this.owner,
      });
      this.winGame();
    }
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

    updateFollowCamera({
      camera: this.camera,
      target: this.dog.position,
      pointerState: this.pointerState,
      delta,
    });

    updateObjectiveMarkers({
      elapsed,
      sockMarker: this.sockMarker,
      ownerMarker: this.ownerMarker,
      sock: this.sock,
      owner: this.owner,
      worldState: this.worldState,
      dogState: this.dogState,
    });

    this.checkObjectives();
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.render);
  }
}
