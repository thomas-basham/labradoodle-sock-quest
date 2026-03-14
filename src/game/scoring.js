import { clamp } from "../utils/math";
import { SCORING_CONFIG } from "./config";

const scoreFormatter = new Intl.NumberFormat("en-US");

function createRoundBreakdown() {
  return {
    returnedCount: 0,
    basePoints: 0,
    timeBonus: 0,
    comboBonus: 0,
    finalScore: 0,
  };
}

function resetComboState(scoringState) {
  scoringState.comboCount = 0;
  scoringState.comboLabel = "";
  scoringState.comboBonus = 0;
  scoringState.comboExpiresAt = 0;
}

function resetRoundState(scoringState, startTimeMs) {
  resetComboState(scoringState);
  scoringState.lastReturnAt = null;
  scoringState.activeSockStartedAt = startTimeMs;
  scoringState.roundBreakdown = createRoundBreakdown();
}

function readStoredNumber(storageKey) {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (rawValue === null) {
      return null;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
  } catch {
    return null;
  }
}

function writeStoredNumber(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, String(value));
  } catch {
    // Ignore storage failures and keep the in-memory score.
  }
}

function getComboTier(comboCount) {
  let matchedTier = null;

  SCORING_CONFIG.comboTiers.forEach((tier) => {
    if (comboCount >= tier.minimumChain) {
      matchedTier = tier;
    }
  });

  return matchedTier;
}

function getTimeBonus(elapsedMs) {
  const normalizedWindow =
    1 - clamp(elapsedMs / SCORING_CONFIG.fastReturnWindowMs, 0, 1);
  return Math.round(normalizedWindow * SCORING_CONFIG.maxTimeBonusPerSock);
}

export function formatScore(value) {
  return scoreFormatter.format(Math.max(0, Math.round(value ?? 0)));
}

export function createScoringState() {
  return {
    bankedScore: 0,
    campaignScore: 0,
    highScore: null,
    comboCount: 0,
    comboLabel: "",
    comboBonus: 0,
    comboExpiresAt: 0,
    lastReturnAt: null,
    activeSockStartedAt: null,
    roundBreakdown: createRoundBreakdown(),
  };
}

export function loadStoredHighScore() {
  return readStoredNumber(SCORING_CONFIG.highScoreStorageKey);
}

export function saveStoredHighScore(score) {
  writeStoredNumber(SCORING_CONFIG.highScoreStorageKey, Math.max(0, Math.round(score)));
}

export function resetCampaignScoring(scoringState) {
  scoringState.bankedScore = 0;
  scoringState.campaignScore = 0;
  resetRoundState(scoringState, null);
}

export function beginNextRoundScoring(scoringState, startTimeMs) {
  scoringState.bankedScore = scoringState.campaignScore;
  scoringState.campaignScore = scoringState.bankedScore;
  resetRoundState(scoringState, startTimeMs);
}

export function restartRoundScoring(scoringState, startTimeMs) {
  scoringState.campaignScore = scoringState.bankedScore;
  resetRoundState(scoringState, startTimeMs);
}

export function shiftScoringTimers(scoringState, pauseDurationMs) {
  if (scoringState.lastReturnAt !== null) {
    scoringState.lastReturnAt += pauseDurationMs;
  }

  if (scoringState.activeSockStartedAt !== null) {
    scoringState.activeSockStartedAt += pauseDurationMs;
  }

  if (scoringState.comboExpiresAt > 0) {
    scoringState.comboExpiresAt += pauseDurationMs;
  }
}

export function scoreSockReturn(scoringState, now) {
  const retrievalDuration =
    scoringState.activeSockStartedAt === null
      ? SCORING_CONFIG.fastReturnWindowMs
      : now - scoringState.activeSockStartedAt;
  const basePoints = SCORING_CONFIG.basePointsPerSock;
  const timeBonus = getTimeBonus(retrievalDuration);
  const withinComboWindow =
    scoringState.lastReturnAt !== null &&
    now - scoringState.lastReturnAt <= SCORING_CONFIG.comboWindowMs;
  const comboCount = withinComboWindow ? scoringState.comboCount + 1 : 1;
  const comboTier = getComboTier(comboCount);
  const comboBonus = comboTier ? comboTier.bonus : 0;
  const pointsAwarded = basePoints + timeBonus + comboBonus;

  scoringState.comboCount = comboCount;
  scoringState.comboLabel = comboTier ? comboTier.label : "";
  scoringState.comboBonus = comboBonus;
  scoringState.comboExpiresAt = comboTier ? now + SCORING_CONFIG.comboWindowMs : 0;
  scoringState.lastReturnAt = now;
  scoringState.activeSockStartedAt = now;
  scoringState.roundBreakdown.returnedCount += 1;
  scoringState.roundBreakdown.basePoints += basePoints;
  scoringState.roundBreakdown.timeBonus += timeBonus;
  scoringState.roundBreakdown.comboBonus += comboBonus;
  scoringState.roundBreakdown.finalScore += pointsAwarded;
  scoringState.campaignScore = scoringState.bankedScore + scoringState.roundBreakdown.finalScore;

  return {
    pointsAwarded,
    basePoints,
    timeBonus,
    comboBonus,
    comboCount,
    comboLabel: scoringState.comboLabel,
  };
}

export function getComboStatus(scoringState, now) {
  if (scoringState.comboExpiresAt > 0 && now >= scoringState.comboExpiresAt) {
    resetComboState(scoringState);
  }

  const active = scoringState.comboExpiresAt > now && scoringState.comboLabel !== "";
  return {
    active,
    label: scoringState.comboLabel,
    count: scoringState.comboCount,
    bonus: scoringState.comboBonus,
    remainingMs: active ? scoringState.comboExpiresAt - now : 0,
  };
}

export function getRoundScoreBreakdown(scoringState) {
  return { ...scoringState.roundBreakdown };
}
