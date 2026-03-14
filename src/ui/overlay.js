import { SETTINGS_CONFIG } from "../game/config";

function formatSensitivity(value) {
  return `${Math.round(value * 100)}%`;
}

function renderStartScreen(levels) {
  return `
    <p class="eyebrow">Chief Laundry Investigator</p>
    <h2>Ray's Sock Quest</h2>
    <p class="overlay-subtitle">A three-yard sock safari starring the neighborhood's most committed labradoodle.</p>
    <p class="overlay-copy">
      Progress through three backyard scenarios, recover every missing sock in each one,
      and bring the whole laundry operation back to Becca's hamper in one piece.
    </p>
    <div class="level-preview-grid">
      ${levels
        .map(
          (level) => `
            <section class="level-preview-card">
              <p class="level-preview-index">Yard ${level.number}</p>
              <p class="level-preview-name">${level.name}</p>
              <p class="level-preview-text">${level.description}</p>
              ${level.hasVacuum ? '<p class="level-preview-note">Robot vacuum patrol active</p>' : ""}
            </section>
          `,
        )
        .join("")}
    </div>
    <div class="overlay-actions">
      <button type="button" data-action="play">Play</button>
      <button class="secondary-button" type="button" data-action="open-controls">Controls</button>
      <button class="secondary-button" type="button" data-action="open-settings">Settings</button>
    </div>
  `;
}

function renderPauseScreen() {
  return `
    <p class="eyebrow">Paws Up</p>
    <h2>Game paused</h2>
    <p class="overlay-subtitle">Ray is holding position until you call the next move.</p>
    <p class="overlay-copy">
      The yard is frozen, the timer is frozen, and the active sock is staying exactly where you left it.
    </p>
    <div class="overlay-actions">
      <button type="button" data-action="resume">Resume</button>
      <button class="secondary-button" type="button" data-action="restart">Restart yard</button>
      <button class="secondary-button" type="button" data-action="open-controls">Controls</button>
      <button class="secondary-button" type="button" data-action="open-settings">Settings</button>
    </div>
  `;
}

function renderControlsScreen() {
  return `
    <p class="eyebrow">Field Guide</p>
    <h2>Controls and help</h2>
    <p class="overlay-subtitle">Everything Ray needs for a clean sock recovery operation.</p>
    <div class="help-grid">
      <section class="help-card">
        <p class="help-label">Desktop</p>
        <ul class="help-list">
          <li><strong>Move:</strong> WASD or Arrow Keys</li>
          <li><strong>Look:</strong> Mouse drag</li>
          <li><strong>Sprint:</strong> Shift</li>
          <li><strong>Sniff:</strong> Space</li>
          <li><strong>Pause:</strong> Escape</li>
        </ul>
      </section>
      <section class="help-card">
        <p class="help-label">Mobile</p>
        <ul class="help-list">
          <li><strong>Move:</strong> Left joystick</li>
          <li><strong>Look:</strong> Drag anywhere outside the controls</li>
          <li><strong>Sprint:</strong> Sprint button</li>
          <li><strong>Sniff:</strong> Sniff button</li>
          <li><strong>Pause:</strong> Menu button</li>
        </ul>
      </section>
    </div>
    <section class="help-card help-card-wide">
      <p class="help-label">Campaign flow</p>
      <ul class="help-list">
        <li>Only one sock is active at a time. Follow the marker to the current target.</li>
        <li>After pickup, the marker flips to Becca so you can return the sock to the hamper.</li>
        <li>Complete Sunny Backyard, then Evening Backyard, then Chaotic Laundry Day.</li>
        <li>Mud slows Ray, toys bounce her, sprinklers mist the camera, flower beds block movement, and later yards may unleash a robot vacuum.</li>
      </ul>
    </section>
    <div class="overlay-actions">
      <button class="secondary-button" type="button" data-action="back">Back</button>
    </div>
  `;
}

function renderSettingsScreen(settings, audioSupported) {
  const soundLabel = audioSupported ? "Sound enabled" : "Sound unavailable";
  return `
    <p class="eyebrow">Kennel Settings</p>
    <h2>Settings</h2>
    <p class="overlay-subtitle">Tune the hunt for comfort, clarity, and backyard-grade performance.</p>
    <div class="settings-list">
      <label class="setting-row ${audioSupported ? "" : "setting-row-disabled"}">
        <span class="setting-copy">
          <span class="setting-label">Sound</span>
          <span class="setting-detail">Music and synth SFX for Ray's sock heroics.</span>
        </span>
        <span class="toggle-control">
          <input
            id="overlaySoundSetting"
            type="checkbox"
            data-setting="soundEnabled"
            ${settings.soundEnabled ? "checked" : ""}
            ${audioSupported ? "" : "disabled"}
          />
          <span>${soundLabel}</span>
        </span>
      </label>
      <label class="setting-row">
        <span class="setting-copy">
          <span class="setting-label">Mouse sensitivity</span>
          <span class="setting-detail">Current: <span id="overlaySensitivityValue">${formatSensitivity(settings.mouseSensitivity)}</span></span>
        </span>
        <input
          class="setting-range"
          type="range"
          min="${SETTINGS_CONFIG.mouseSensitivity.min}"
          max="${SETTINGS_CONFIG.mouseSensitivity.max}"
          step="${SETTINGS_CONFIG.mouseSensitivity.step}"
          value="${settings.mouseSensitivity}"
          data-setting="mouseSensitivity"
        />
      </label>
      <label class="setting-row">
        <span class="setting-copy">
          <span class="setting-label">Invert Y</span>
          <span class="setting-detail">Flip vertical camera look.</span>
        </span>
        <span class="toggle-control">
          <input
            type="checkbox"
            data-setting="invertY"
            ${settings.invertY ? "checked" : ""}
          />
          <span>${settings.invertY ? "On" : "Off"}</span>
        </span>
      </label>
      <label class="setting-row">
        <span class="setting-copy">
          <span class="setting-label">Robot vacuum</span>
          <span class="setting-detail">Enables the patrol vacuum in Evening Backyard and Chaotic Laundry Day.</span>
        </span>
        <span class="toggle-control">
          <input
            type="checkbox"
            data-setting="vacuumEnabled"
            ${settings.vacuumEnabled ? "checked" : ""}
          />
          <span>${settings.vacuumEnabled ? "Enabled" : "Disabled"}</span>
        </span>
      </label>
      <label class="setting-row">
        <span class="setting-copy">
          <span class="setting-label">Quality preset</span>
          <span class="setting-detail">Controls pixel ratio and shadow quality.</span>
        </span>
        <select class="setting-select" data-setting="qualityPreset">
          ${SETTINGS_CONFIG.qualityPresets
            .map(
              (preset) =>
                `<option value="${preset}" ${settings.qualityPreset === preset ? "selected" : ""}>${
                  preset[0].toUpperCase() + preset.slice(1)
                }</option>`,
            )
            .join("")}
        </select>
      </label>
    </div>
    <div class="overlay-actions">
      <button class="secondary-button" type="button" data-action="back">Back</button>
    </div>
  `;
}

function renderScoreBreakdown({
  socksReturnedText,
  basePointsText,
  timeBonusText,
  comboBonusText,
  finalScoreText,
  campaignScoreText,
}) {
  return `
    <section class="overlay-summary overlay-summary-breakdown">
      <p class="overlay-section-label">Score breakdown</p>
      <div class="overlay-summary-grid">
        <div class="overlay-stat">
          <p class="meta-label">Socks returned</p>
          <p class="overlay-stat-value">${socksReturnedText}</p>
          <p class="overlay-stat-detail">${basePointsText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Time bonus</p>
          <p class="overlay-stat-value">${timeBonusText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Combo bonus</p>
          <p class="overlay-stat-value">${comboBonusText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Final score</p>
          <p class="overlay-stat-value">${finalScoreText}</p>
        </div>
      </div>
      <p class="overlay-best-notice">Campaign score: ${campaignScoreText}</p>
    </section>
  `;
}

function renderLevelCompleteScreen({
  levelName,
  nextLevelName,
  levelNumber,
  totalLevels,
  levelTimeText,
  bestTimeText,
  isNewBest,
  socksReturnedText,
  basePointsText,
  timeBonusText,
  comboBonusText,
  finalScoreText,
  campaignScoreText,
}) {
  return `
    <p class="eyebrow">Yard Cleared</p>
    <h2>${levelName} complete</h2>
    <p class="overlay-subtitle">Yard ${levelNumber} of ${totalLevels} is done. Next up: ${nextLevelName}.</p>
    <div class="overlay-summary">
      <div class="overlay-summary-grid">
        <div class="overlay-stat">
          <p class="meta-label">Yard time</p>
          <p class="overlay-stat-value">${levelTimeText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Best yard time</p>
          <p class="overlay-stat-value">${bestTimeText}</p>
        </div>
      </div>
      <p class="overlay-best-notice">${isNewBest ? "New best time!" : "Best yard time stands."}</p>
    </div>
    ${renderScoreBreakdown({
      socksReturnedText,
      basePointsText,
      timeBonusText,
      comboBonusText,
      finalScoreText,
      campaignScoreText,
    })}
    <div class="overlay-actions">
      <button type="button" data-action="next-level">Next yard</button>
      <button class="secondary-button" type="button" data-action="open-controls">Controls</button>
      <button class="secondary-button" type="button" data-action="open-settings">Settings</button>
    </div>
  `;
}

function renderGameCompleteScreen({
  totalCampaignTimeText,
  bestTimeText,
  totalLevels,
  finalScoreText,
  highScoreText,
  isNewHighScore,
}) {
  return `
    <p class="eyebrow">Laundry Masterclass</p>
    <h2>Every backyard conquered</h2>
    <p class="overlay-subtitle">Ray cleared all ${totalLevels} yard variations and returned every sock to Becca.</p>
    <div class="overlay-summary">
      <div class="overlay-summary-grid">
        <div class="overlay-stat">
          <p class="meta-label">Campaign time</p>
          <p class="overlay-stat-value">${totalCampaignTimeText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Final score</p>
          <p class="overlay-stat-value">${finalScoreText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">High score</p>
          <p class="overlay-stat-value">${highScoreText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Best single yard</p>
          <p class="overlay-stat-value">${bestTimeText}</p>
        </div>
      </div>
      <p class="overlay-best-notice">
        ${isNewHighScore ? "New high score for Ray's backyard run!" : "Sunny, evening, and laundry chaos: fully solved."}
      </p>
    </div>
    <div class="overlay-actions">
      <button type="button" data-action="replay-campaign">Replay campaign</button>
      <button class="secondary-button" type="button" data-action="open-controls">Controls</button>
      <button class="secondary-button" type="button" data-action="open-settings">Settings</button>
    </div>
  `;
}

export function createOverlay() {
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("overlayPanel");

  if (!(overlay instanceof HTMLElement) || !(panel instanceof HTMLElement)) {
    return {
      showStart() {},
      showPause() {},
      showLevelComplete() {},
      showGameComplete() {},
      updateSettings() {},
      hide() {},
      isVisible() {
        return false;
      },
      getScreen() {
        return "start";
      },
      handleEscape() {
        return false;
      },
      onAction() {
        return () => {};
      },
      onSettingsChange() {
        return () => {};
      },
    };
  }

  let currentScreen = "start";
  let backScreen = "start";
  let currentSettings = null;
  let audioSupported = true;
  let previewLevels = [];
  let levelCompleteData = null;
  let gameCompleteData = null;
  let actionHandler = () => {};
  let settingsChangeHandler = () => {};

  function renderCurrentScreen() {
    if (currentScreen === "start") {
      panel.innerHTML = renderStartScreen(previewLevels);
      return;
    }

    if (currentScreen === "pause") {
      panel.innerHTML = renderPauseScreen();
      return;
    }

    if (currentScreen === "controls") {
      panel.innerHTML = renderControlsScreen();
      return;
    }

    if (currentScreen === "settings") {
      panel.innerHTML = renderSettingsScreen(currentSettings, audioSupported);
      return;
    }

    if (currentScreen === "level-complete" && levelCompleteData) {
      panel.innerHTML = renderLevelCompleteScreen(levelCompleteData);
      return;
    }

    if (currentScreen === "game-complete" && gameCompleteData) {
      panel.innerHTML = renderGameCompleteScreen(gameCompleteData);
    }
  }

  function syncSettingsInputs() {
    const soundInput = panel.querySelector('[data-setting="soundEnabled"]');
    const sensitivityInput = panel.querySelector('[data-setting="mouseSensitivity"]');
    const sensitivityValue = panel.querySelector("#overlaySensitivityValue");
    const invertYInput = panel.querySelector('[data-setting="invertY"]');
    const vacuumInput = panel.querySelector('[data-setting="vacuumEnabled"]');
    const qualityInput = panel.querySelector('[data-setting="qualityPreset"]');

    if (soundInput instanceof HTMLInputElement) {
      soundInput.checked = currentSettings.soundEnabled;
      soundInput.disabled = !audioSupported;
      const label = soundInput.parentElement?.querySelector("span:last-child");
      if (label) {
        label.textContent = audioSupported
          ? currentSettings.soundEnabled
            ? "Sound enabled"
            : "Sound muted"
          : "Sound unavailable";
      }
    }

    if (sensitivityInput instanceof HTMLInputElement) {
      sensitivityInput.value = String(currentSettings.mouseSensitivity);
    }

    if (sensitivityValue) {
      sensitivityValue.textContent = formatSensitivity(currentSettings.mouseSensitivity);
    }

    if (invertYInput instanceof HTMLInputElement) {
      invertYInput.checked = currentSettings.invertY;
      const label = invertYInput.parentElement?.querySelector("span:last-child");
      if (label) {
        label.textContent = currentSettings.invertY ? "On" : "Off";
      }
    }

    if (vacuumInput instanceof HTMLInputElement) {
      vacuumInput.checked = currentSettings.vacuumEnabled;
      const label = vacuumInput.parentElement?.querySelector("span:last-child");
      if (label) {
        label.textContent = currentSettings.vacuumEnabled ? "Enabled" : "Disabled";
      }
    }

    if (qualityInput instanceof HTMLSelectElement) {
      qualityInput.value = currentSettings.qualityPreset;
    }
  }

  function showScreen(screenName) {
    currentScreen = screenName;
    renderCurrentScreen();
    overlay.classList.remove("hidden");
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const { action } = button.dataset;

    if (action === "open-controls") {
      backScreen = currentScreen;
      showScreen("controls");
      return;
    }

    if (action === "open-settings") {
      backScreen = currentScreen;
      showScreen("settings");
      return;
    }

    if (action === "back") {
      showScreen(backScreen);
      return;
    }

    actionHandler(action);
  }

  function handleSettingInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const settingName = target.dataset.setting;
    if (!settingName) {
      return;
    }

    if (settingName === "mouseSensitivity" && target instanceof HTMLInputElement) {
      const nextValue = Number(target.value);
      const valueLabel = panel.querySelector("#overlaySensitivityValue");
      if (valueLabel) {
        valueLabel.textContent = formatSensitivity(nextValue);
      }
      settingsChangeHandler({ mouseSensitivity: nextValue });
      return;
    }

    if (settingName === "soundEnabled" && target instanceof HTMLInputElement) {
      settingsChangeHandler({ soundEnabled: target.checked });
      const label = target.parentElement?.querySelector("span:last-child");
      if (label) {
        label.textContent = audioSupported
          ? target.checked
            ? "Sound enabled"
            : "Sound muted"
          : "Sound unavailable";
      }
      return;
    }

    if (settingName === "invertY" && target instanceof HTMLInputElement) {
      settingsChangeHandler({ invertY: target.checked });
      const label = target.parentElement?.querySelector("span:last-child");
      if (label) {
        label.textContent = target.checked ? "On" : "Off";
      }
      return;
    }

    if (settingName === "vacuumEnabled" && target instanceof HTMLInputElement) {
      settingsChangeHandler({ vacuumEnabled: target.checked });
      const label = target.parentElement?.querySelector("span:last-child");
      if (label) {
        label.textContent = target.checked ? "Enabled" : "Disabled";
      }
      return;
    }

    if (settingName === "qualityPreset" && target instanceof HTMLSelectElement) {
      settingsChangeHandler({ qualityPreset: target.value });
    }
  }

  panel.addEventListener("click", handleClick);
  panel.addEventListener("input", handleSettingInput);
  panel.addEventListener("change", handleSettingInput);

  return {
    showStart({ settings, supportsAudio = true, levels = [] }) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      previewLevels = levels;
      showScreen("start");
    },

    showPause({ settings, supportsAudio = true }) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      showScreen("pause");
    },

    showLevelComplete({ settings, supportsAudio = true, ...data }) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      levelCompleteData = data;
      showScreen("level-complete");
    },

    showGameComplete({ settings, supportsAudio = true, ...data }) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      gameCompleteData = data;
      showScreen("game-complete");
    },

    updateSettings(settings, { supportsAudio = audioSupported } = {}) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      if (currentScreen === "settings") {
        syncSettingsInputs();
      }
    },

    hide() {
      overlay.classList.add("hidden");
    },

    isVisible() {
      return !overlay.classList.contains("hidden");
    },

    getScreen() {
      return currentScreen;
    },

    handleEscape() {
      if (currentScreen === "controls" || currentScreen === "settings") {
        showScreen(backScreen);
        return true;
      }

      return false;
    },

    onAction(handler) {
      actionHandler = handler;
      return () => {
        actionHandler = () => {};
      };
    },

    onSettingsChange(handler) {
      settingsChangeHandler = handler;
      return () => {
        settingsChangeHandler = () => {};
      };
    },
  };
}
