import * as THREE from "three";

import { AudioSystem } from "../audio/audioSystem";
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
import { VacuumEnemy } from "../entities/vacuum";
import { JuiceSystem } from "../effects/juiceSystem";
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
  MOVEMENT_CONFIG,
  OWNER_CELEBRATION_LINES,
  OWNER_REACTION_LINES,
  ROUND_CONFIG,
  SCENE_CONFIG,
  SNIFF_CONFIG,
  VACUUM_BUMP_LINES,
  VACUUM_SPOTTED_LINES,
  getReturningObjective,
  getSearchingObjective,
  getSniffHint,
} from "./config";
import { LevelManager } from "./LevelManager";
import {
  beginNextRoundScoring,
  createScoringState,
  formatScore,
  getComboStatus,
  getRoundScoreBreakdown,
  loadStoredHighScore,
  resetCampaignScoring,
  restartRoundScoring,
  saveStoredHighScore,
  scoreSockReturn,
  shiftScoringTimers,
} from "./scoring";
import { applyQualityPreset, loadSettings, updateSettings } from "./settings";
import {
  createDogState,
  createInputState,
  createPointerState,
  createTouchState,
  createWorldState,
  resetInputState,
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
    this.settings = loadSettings();
    this.levelManager = new LevelManager();
    applyQualityPreset(this.renderer, this.settings.qualityPreset);
    this.clock = new THREE.Clock();
    this.tempVector = new THREE.Vector3();
    this.effectVector = new THREE.Vector3();
    this.previousDogPosition = new THREE.Vector3();

    this.worldState = createWorldState();
    this.scoringState = createScoringState();
    this.pointerState = createPointerState();
    this.inputState = createInputState();
    this.touchState = createTouchState();

    this.environment = buildEnvironment({ scene: this.scene, worldSize: this.worldState.size });
    this.environment.applyLevel(this.levelManager.getCurrentLevel());

    this.owner = createOwner(this.scene);
    this.dog = createDog(this.scene);
    this.dogState = createDogState(this.dog);
    this.audioSystem = new AudioSystem({
      enabled: this.settings.soundEnabled,
    });
    this.juiceSystem = new JuiceSystem({
      scene: this.scene,
      dog: this.dog,
    });
    this.sockManager = new SockManager({
      scene: this.scene,
      dog: this.dog,
      owner: this.owner,
    });
    this.hazardSystem = new HazardSystem({
      scene: this.scene,
    });
    this.vacuumEnemy = new VacuumEnemy({
      scene: this.scene,
    });

    this.hud = createHud();
    this.overlay = createOverlay();
    this.moveKnob = document.getElementById("moveKnob");
    this.sniffButton = document.getElementById("sniffButton");
    this.sniffCooldownEndsAt = 0;
    this.sockDropProtectedUntil = 0;
    this.pauseStartedAt = null;
    this.hud.setName(DOG_NAME);
    this.setLevelLabel(this.levelManager.getLevelLabel());
    this.hud.setObjective(this.worldState.objective);
    this.hud.setProgress(this.worldState.socksReturned, this.worldState.totalSocks);
    this.hud.setRoundTime(formatElapsedTime(this.worldState.roundTimeMs));
    this.worldState.bestTimeMs = loadStoredBestTime(ROUND_CONFIG.bestTimeStorageKey);
    this.scoringState.highScore = loadStoredHighScore();
    this.hud.setBestTime(formatElapsedTime(this.worldState.bestTimeMs));
    this.hud.setScore(formatScore(this.scoringState.campaignScore));
    this.hud.setCombo(null);
    this.hud.setSniffHint(this.worldState.sniffHint);
    this.hud.setSniffCooldown(0, SNIFF_CONFIG.cooldownMs);
    this.hud.setFlavor(DEFAULT_FLAVOR_MESSAGE);
    this.hud.setHazardStatus(HAZARD_CONFIG.defaultStatus);
    this.hud.setSprinklerOverlay(0);
    this.overlay.showStart({
      settings: this.settings,
      supportsAudio: this.audioSystem.isSupported(),
      levels: this.levelManager.getPreviewLevels(),
    });
    this.roundStartTime = null;

    this.handleOverlayAction = this.handleOverlayAction.bind(this);
    this.handleMenu = this.handleMenu.bind(this);
    this.handlePauseToggle = this.handlePauseToggle.bind(this);
    this.handlePrimaryAction = this.handlePrimaryAction.bind(this);
    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.handleSoundToggle = this.handleSoundToggle.bind(this);
    this.handleSniff = this.handleSniff.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.render = this.render.bind(this);

    this.cleanups = [
      this.overlay.onAction(this.handleOverlayAction),
      this.overlay.onSettingsChange(this.handleSettingsChange),
      registerKeyboardControls({
        inputState: this.inputState,
        onPrimaryAction: this.handlePrimaryAction,
        onSniff: this.handleSniff,
        onPauseToggle: this.handlePauseToggle,
        canControl: () => this.canControl(),
      }),
      this.hud.onSoundToggle(this.handleSoundToggle),
      this.hud.onMenu(this.handleMenu),
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
        canControl: () => this.canControl(),
        getLookSettings: () => this.getLookSettings(),
      }),
    ];
    this.hud.setSoundEnabled(this.audioSystem.getEnabled(), this.audioSystem.isSupported());

    window.addEventListener("resize", this.handleResize);
    this.animationFrameId = null;
    this.updateSniffUi();
    this.updateComboUi();
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
    this.audioSystem.destroy();
    this.juiceSystem.destroy();
    this.renderer.dispose();
  }

  handleResize() {
    resizeFollowCamera(this.camera);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    applyQualityPreset(this.renderer, this.settings.qualityPreset);
  }

  canControl() {
    return this.worldState.gameStarted && !this.worldState.paused && !this.overlay.isVisible();
  }

  getLookSettings() {
    return {
      mouseSensitivity: this.settings.mouseSensitivity,
      invertY: this.settings.invertY,
    };
  }

  clearControlState() {
    resetInputState(this.inputState);
    this.pointerState.active = false;
    this.touchState.moveId = null;
    this.touchState.lookId = null;
    this.touchState.moveVector.set(0, 0);

    if (this.moveKnob) {
      this.moveKnob.style.transform = "translate(0px, 0px)";
    }
  }

  applySettings() {
    this.audioSystem.setEnabled(this.settings.soundEnabled);
    this.hud.setSoundEnabled(this.settings.soundEnabled, this.audioSystem.isSupported());
    this.overlay.updateSettings(this.settings, {
      supportsAudio: this.audioSystem.isSupported(),
    });
    applyQualityPreset(this.renderer, this.settings.qualityPreset);
    this.syncVacuumEnabled();
  }

  handleSettingsChange(patch) {
    this.settings = updateSettings(this.settings, patch);
    this.applySettings();

    if (this.settings.soundEnabled) {
      this.audioSystem.unlock();
    }
  }

  handleSoundToggle() {
    this.handleSettingsChange({
      soundEnabled: !this.settings.soundEnabled,
    });
  }

  setLevelLabel(text) {
    this.worldState.currentLevelName = this.levelManager.getCurrentLevel().name;
    this.worldState.currentLevelNumber = this.levelManager.getCurrentLevelNumber();
    this.worldState.totalLevels = this.levelManager.getTotalLevels();
    this.hud.setLevel(text);
  }

  syncVacuumEnabled() {
    const currentLevel = this.levelManager.getCurrentLevel();
    this.vacuumEnemy.setEnabled(
      Boolean(this.settings.vacuumEnabled && currentLevel.vacuum?.enabled),
    );
  }

  beginCampaign() {
    this.levelManager.resetCampaign();
    this.worldState.campaignElapsedMs = 0;
    resetCampaignScoring(this.scoringState);
    this.setScore(this.scoringState.campaignScore);
    this.startRound({ carryOverScore: false });
  }

  advanceToNextLevel() {
    if (this.levelManager.advanceLevel()) {
      this.startRound({ carryOverScore: true });
    }
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

  setScore(score) {
    this.hud.setScore(formatScore(score));
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

  applyVacuumFeedback(feedback, now = performance.now()) {
    if (feedback.status) {
      this.setHazardStatus(feedback.status);
    }

    if (feedback.spotted) {
      this.setFlavor(randomItem(VACUUM_SPOTTED_LINES));
    }

    if (feedback.impulse) {
      nudgeDog(this.dogState, feedback.impulse);
    }

    if (!feedback.droppedSock || now < this.sockDropProtectedUntil) {
      return;
    }

    if (this.sockManager.dropCarriedSock({
      position: this.dog.position,
      yaw: this.dogState.yaw,
    })) {
      this.dogState.hasSock = false;
      this.worldState.state = GAME_STATES.searching;
      this.setObjective(
        getSearchingObjective(this.worldState.socksReturned, this.worldState.totalSocks),
      );
      this.setSniffHint(SNIFF_CONFIG.defaultHint);
      this.setFlavor(randomItem(VACUUM_BUMP_LINES));
      this.updateSniffUi();
    }
  }

  getSniffCooldownRemaining(now = performance.now()) {
    const referenceNow =
      this.worldState.paused && this.pauseStartedAt !== null ? this.pauseStartedAt : now;
    return Math.max(0, this.sniffCooldownEndsAt - referenceNow);
  }

  updateSniffUi(now = performance.now()) {
    const remainingMs = this.getSniffCooldownRemaining(now);
    const sniffAvailable =
      this.worldState.gameStarted &&
      !this.worldState.paused &&
      this.worldState.state === GAME_STATES.searching &&
      remainingMs === 0;

    this.hud.setSniffCooldown(remainingMs, SNIFF_CONFIG.cooldownMs);

    if (this.sniffButton) {
      this.sniffButton.disabled = !sniffAvailable;
    }
  }

  updateComboUi(now = performance.now()) {
    const referenceNow =
      this.worldState.paused && this.pauseStartedAt !== null ? this.pauseStartedAt : now;
    const comboStatus = getComboStatus(this.scoringState, referenceNow);

    if (!comboStatus.active) {
      this.hud.setCombo(null);
      return;
    }

    this.hud.setCombo({
      label: `${comboStatus.label} x${comboStatus.count}`,
      detail: `+${formatScore(comboStatus.bonus)} combo bonus · ${(comboStatus.remainingMs / 1000).toFixed(1)}s to keep it rolling`,
    });
  }

  getRoundScoreSummary() {
    const breakdown = getRoundScoreBreakdown(this.scoringState);

    return {
      socksReturnedText: `${breakdown.returnedCount} / ${this.worldState.totalSocks}`,
      basePointsText: `${formatScore(breakdown.basePoints)} pts base`,
      timeBonusText: `+${formatScore(breakdown.timeBonus)}`,
      comboBonusText: `+${formatScore(breakdown.comboBonus)}`,
      finalScoreText: formatScore(breakdown.finalScore),
      campaignScoreText: formatScore(this.scoringState.campaignScore),
    };
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

  handlePrimaryAction() {
    const screen = this.overlay.getScreen();

    if (screen === "start") {
      this.beginCampaign();
      return;
    }

    if (screen === "pause") {
      this.resumeGame();
      return;
    }

    if (screen === "level-complete") {
      this.advanceToNextLevel();
      return;
    }

    if (screen === "game-complete") {
      this.beginCampaign();
    }
  }

  handleOverlayAction(action) {
    if (action === "play") {
      this.beginCampaign();
      return;
    }

    if (action === "resume") {
      this.resumeGame();
      return;
    }

    if (action === "restart") {
      this.resetRound();
      return;
    }

    if (action === "next-level") {
      this.advanceToNextLevel();
      return;
    }

    if (action === "replay-campaign") {
      this.beginCampaign();
    }
  }

  handleMenu() {
    if (this.worldState.gameStarted && !this.worldState.paused) {
      this.pauseGame();
    }
  }

  handlePauseToggle() {
    if (this.overlay.handleEscape()) {
      return;
    }

    if (this.worldState.paused) {
      this.resumeGame();
      return;
    }

    if (this.worldState.gameStarted) {
      this.pauseGame();
    }
  }

  pauseGame() {
    if (!this.worldState.gameStarted || this.worldState.paused) {
      return;
    }

    const now = performance.now();
    this.worldState.paused = true;
    this.pauseStartedAt = now;
    this.audioSystem.setPaused(true);
    this.clearControlState();
    this.overlay.showPause({
      settings: this.settings,
      supportsAudio: this.audioSystem.isSupported(),
    });
    this.updateSniffUi(now);
  }

  resumeGame() {
    if (!this.worldState.paused) {
      return;
    }

    const now = performance.now();
    const pauseDuration = now - (this.pauseStartedAt ?? now);
    this.worldState.paused = false;
    this.pauseStartedAt = null;

    if (this.roundStartTime !== null) {
      this.roundStartTime += pauseDuration;
    }

    if (this.sniffCooldownEndsAt > 0) {
      this.sniffCooldownEndsAt += pauseDuration;
    }

    if (this.sockDropProtectedUntil > 0) {
      this.sockDropProtectedUntil += pauseDuration;
    }

    this.hazardSystem.shiftTimers(pauseDuration);
    this.vacuumEnemy.shiftTimers(pauseDuration);
    shiftScoringTimers(this.scoringState, pauseDuration);
    this.audioSystem.setPaused(false);
    this.overlay.hide();
    this.updateComboUi(now);
    this.updateSniffUi(now);
  }

  startRound({ carryOverScore = false } = {}) {
    const currentLevel = this.levelManager.getCurrentLevel();
    this.worldState.paused = false;
    this.pauseStartedAt = null;
    this.audioSystem.setPaused(false);
    this.audioSystem.unlock();
    this.clearControlState();
    this.environment.applyLevel(currentLevel);
    this.setLevelLabel(this.levelManager.getLevelLabel());
    resetDog(this.dog, this.dogState);
    resetOwner(this.owner);
    this.juiceSystem.reset();
    this.sockManager.resetRound({
      spawnPoints: currentLevel.sockSpawnPoints,
    });
    this.hazardSystem.resetRound({
      reservedPositions: [
        ...this.sockManager.getRoundSockPositions(),
        this.owner.position.clone(),
        new THREE.Vector3(...DOG_CONFIG.spawn),
      ],
      levelHazards: currentLevel.hazards,
    });
    this.vacuumEnemy.resetRound({
      enabled: Boolean(this.settings.vacuumEnabled && currentLevel.vacuum?.enabled),
      patrolPoints: currentLevel.vacuum?.patrolPoints ?? [],
    });
    this.worldState.gameStarted = true;
    this.worldState.state = GAME_STATES.searching;
    this.dogState.hasSock = false;
    this.sniffCooldownEndsAt = 0;
    this.sockDropProtectedUntil = 0;
    this.roundStartTime = performance.now();
    if (carryOverScore) {
      beginNextRoundScoring(this.scoringState, this.roundStartTime);
    } else {
      restartRoundScoring(this.scoringState, this.roundStartTime);
    }
    this.overlay.hide();
    this.setSocksReturned(0);
    this.setRoundTime(0);
    this.setScore(this.scoringState.campaignScore);
    this.setObjective(getSearchingObjective(0, this.worldState.totalSocks));
    this.setSniffHint(SNIFF_CONFIG.defaultHint);
    this.setFlavor(this.getRandomFlavor());
    this.setHazardStatus(HAZARD_CONFIG.defaultStatus);
    this.setSprinklerOverlay(0);
    this.updateComboUi(this.roundStartTime);
    this.updateSniffUi(this.roundStartTime);
  }

  completeRound() {
    const currentLevel = this.levelManager.getCurrentLevel();
    const totalTime = performance.now() - this.roundStartTime;
    const previousBest = this.worldState.bestTimeMs;
    const isNewBest = previousBest === null || totalTime < previousBest;
    const roundScoreSummary = this.getRoundScoreSummary();

    this.audioSystem.playRoundComplete();
    triggerOwnerCelebrate(this.owner, randomItem(OWNER_CELEBRATION_LINES));
    this.worldState.state = GAME_STATES.complete;
    this.worldState.gameStarted = false;
    this.worldState.paused = false;
    this.worldState.campaignElapsedMs += totalTime;
    this.sniffCooldownEndsAt = 0;
    this.setRoundTime(totalTime);
    this.setSniffHint(SNIFF_CONFIG.completeHint);
    this.sockManager.hideMarkers();
    this.hud.setCombo(null);

    const bestTime = isNewBest ? totalTime : previousBest;
    if (isNewBest) {
      saveStoredBestTime(ROUND_CONFIG.bestTimeStorageKey, totalTime);
    }
    this.setBestTime(bestTime);

    if (this.levelManager.hasNextLevel()) {
      const nextLevel = this.levelManager.getNextLevel();
      this.setObjective(`Yard clear. ${nextLevel.name} is next on Ray's sock circuit.`);
      this.overlay.showLevelComplete({
        levelName: currentLevel.name,
        nextLevelName: nextLevel.name,
        levelNumber: this.levelManager.getCurrentLevelNumber(),
        totalLevels: this.levelManager.getTotalLevels(),
        levelTimeText: formatElapsedTime(totalTime),
        bestTimeText: formatElapsedTime(bestTime),
        isNewBest,
        ...roundScoreSummary,
        settings: this.settings,
        supportsAudio: this.audioSystem.isSupported(),
      });
    } else {
      const previousHighScore = this.scoringState.highScore;
      const isNewHighScore =
        previousHighScore === null || this.scoringState.campaignScore > previousHighScore;
      const highScore = isNewHighScore ? this.scoringState.campaignScore : previousHighScore;

      if (isNewHighScore) {
        saveStoredHighScore(highScore);
      }

      this.scoringState.highScore = highScore;
      this.setObjective("Campaign complete. Ray solved every backyard sock mystery.");
      this.overlay.showGameComplete({
        totalCampaignTimeText: formatElapsedTime(this.worldState.campaignElapsedMs),
        bestTimeText: formatElapsedTime(bestTime),
        finalScoreText: formatScore(this.scoringState.campaignScore),
        highScoreText: formatScore(highScore),
        isNewHighScore,
        totalLevels: this.levelManager.getTotalLevels(),
        settings: this.settings,
        supportsAudio: this.audioSystem.isSupported(),
      });
    }
    this.updateSniffUi();
  }

  resetRound() {
    this.startRound({ carryOverScore: false });
  }

  pickupSock() {
    this.dogState.hasSock = true;
    this.sockDropProtectedUntil = performance.now() + 800;
    this.setObjective(
      getReturningObjective(this.worldState.socksReturned, this.worldState.totalSocks),
    );
    this.setSniffHint(SNIFF_CONFIG.returningHint);
    this.setFlavor(this.getRandomFlavor());
    this.updateSniffUi();
  }

  handleSniff() {
    const now = performance.now();
    if (
      !this.worldState.gameStarted ||
      this.worldState.paused ||
      this.worldState.state !== GAME_STATES.searching
    ) {
      return;
    }

    if (this.getSniffCooldownRemaining(now) > 0) {
      return;
    }

    const target = this.sockManager.getActiveSockWorldPosition(this.tempVector);
    if (!target || !this.sockManager.activateSniff()) {
      return;
    }

    this.audioSystem.playSniff();
    triggerDogSniff(this.dogState);
    this.sniffCooldownEndsAt = now + SNIFF_CONFIG.cooldownMs;
    this.setSniffHint(getSniffHint(this.dog.position.distanceTo(target)));
    this.updateSniffUi(now);
  }

  checkObjectives() {
    if (this.worldState.state === GAME_STATES.searching) {
      const pickupTarget = this.sockManager.getActiveSockWorldPosition(this.effectVector);
      if (pickupTarget && this.sockManager.tryPickup(this.dog.position)) {
        this.audioSystem.playPickup();
        this.juiceSystem.spawnPickupBurst(pickupTarget);
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
      const now = performance.now();
      scoreSockReturn(this.scoringState, now);
      this.audioSystem.playReturn();
      this.dogState.hasSock = false;
      this.setSocksReturned(result.returnedCount);
      this.setScore(this.scoringState.campaignScore);
      this.updateComboUi(now);

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
    if (!this.worldState.paused) {
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
      this.juiceSystem.update({
        delta,
        dogState: this.dogState,
        inputState: this.inputState,
        gameStarted: this.worldState.gameStarted,
      });
      this.audioSystem.update({
        delta,
        dogSpeed: this.dogState.speed,
        sprinting: this.inputState.sprint,
      });

      this.updateRoundTimer();

      updateFollowCamera({
        camera: this.camera,
        target: this.dog.position,
        pointerState: this.pointerState,
        delta,
        elapsed,
        movementIntensity: Math.min(1, this.dogState.speed / MOVEMENT_CONFIG.sprintSpeed),
        sprinting: this.inputState.sprint,
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

      this.checkObjectives();
      this.applyVacuumFeedback(
        this.vacuumEnemy.update({
          delta,
          elapsed,
          now,
          gameStarted: this.worldState.gameStarted,
          dogPosition: this.dog.position,
          carryingSock: this.dogState.hasSock,
        }),
        now,
      );
    }

    this.updateComboUi(now);
    this.updateSniffUi();
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.render);
  }
}
