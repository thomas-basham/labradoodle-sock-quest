import * as THREE from "three";

import { AUDIO_CONFIG, SETTINGS_CONFIG } from "./config";

const QUALITY_PRESETS = {
  low: {
    pixelRatioCap: 1,
    shadows: false,
    shadowMapType: THREE.BasicShadowMap,
  },
  medium: {
    pixelRatioCap: 1.5,
    shadows: true,
    shadowMapType: THREE.PCFShadowMap,
  },
  high: {
    pixelRatioCap: 2,
    shadows: true,
    shadowMapType: THREE.PCFSoftShadowMap,
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function readLegacySoundSetting() {
  try {
    const rawValue = window.localStorage.getItem(AUDIO_CONFIG.storageKey);
    if (rawValue === null) {
      return AUDIO_CONFIG.enabledByDefault;
    }

    return rawValue === "true";
  } catch {
    return AUDIO_CONFIG.enabledByDefault;
  }
}

function normalizeSettings(rawSettings = {}) {
  const qualityPreset = SETTINGS_CONFIG.qualityPresets.includes(rawSettings.qualityPreset)
    ? rawSettings.qualityPreset
    : SETTINGS_CONFIG.defaultQualityPreset;

  return {
    soundEnabled:
      typeof rawSettings.soundEnabled === "boolean"
        ? rawSettings.soundEnabled
        : readLegacySoundSetting(),
    mouseSensitivity: clamp(
      Number(rawSettings.mouseSensitivity ?? SETTINGS_CONFIG.mouseSensitivity.defaultValue),
      SETTINGS_CONFIG.mouseSensitivity.min,
      SETTINGS_CONFIG.mouseSensitivity.max,
    ),
    invertY:
      typeof rawSettings.invertY === "boolean" ? rawSettings.invertY : SETTINGS_CONFIG.defaultInvertY,
    qualityPreset,
  };
}

export function loadSettings() {
  try {
    const rawValue = window.localStorage.getItem(SETTINGS_CONFIG.storageKey);
    if (rawValue === null) {
      return normalizeSettings();
    }

    return normalizeSettings(JSON.parse(rawValue));
  } catch {
    return normalizeSettings();
  }
}

export function saveSettings(settings) {
  const normalized = normalizeSettings(settings);

  try {
    window.localStorage.setItem(SETTINGS_CONFIG.storageKey, JSON.stringify(normalized));
    window.localStorage.setItem(AUDIO_CONFIG.storageKey, String(normalized.soundEnabled));
  } catch {
    // Ignore storage failures and keep the in-memory settings.
  }

  return normalized;
}

export function updateSettings(settings, patch) {
  return saveSettings({
    ...settings,
    ...patch,
  });
}

export function applyQualityPreset(renderer, qualityPreset) {
  const preset = QUALITY_PRESETS[qualityPreset] ?? QUALITY_PRESETS.high;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatioCap));
  renderer.shadowMap.enabled = preset.shadows;
  renderer.shadowMap.type = preset.shadowMapType;
}
