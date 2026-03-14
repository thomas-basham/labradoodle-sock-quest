import { SETTINGS_CONFIG } from "../game/config";

function formatSensitivity(value) {
  return `${Math.round(value * 100)}%`;
}

function renderStartScreen() {
  return `
    <p class="eyebrow">Chief Laundry Investigator</p>
    <h2>Ray's Sock Quest</h2>
    <p class="overlay-subtitle">A backyard sock safari starring the neighborhood's most committed labradoodle.</p>
    <p class="overlay-copy">
      Five missing socks are loose in the yard. Sniff them out, dodge the backyard nonsense,
      and parade every rescue back to Becca's hamper before the timer runs wild.
    </p>
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
      <button class="secondary-button" type="button" data-action="restart">Restart round</button>
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
      <p class="help-label">Round goal</p>
      <ul class="help-list">
        <li>Only one sock is active at a time. Follow the marker to the current target.</li>
        <li>After pickup, the marker flips to Becca so you can return the sock to the hamper.</li>
        <li>Sniff gives a distance hint and a temporary scent trail toward the active sock.</li>
        <li>Mud slows Ray, toys bounce her, sprinklers mist the camera, and flower beds block movement.</li>
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

function renderRoundCompleteScreen({ totalTimeText, bestTimeText, isNewBest }) {
  return `
    <p class="eyebrow">Laundry Legend</p>
    <h2>Round complete</h2>
    <p class="overlay-subtitle">Ray brought every missing sock back to Becca's hamper.</p>
    <div class="overlay-summary">
      <div class="overlay-summary-grid">
        <div class="overlay-stat">
          <p class="meta-label">Total time</p>
          <p class="overlay-stat-value">${totalTimeText}</p>
        </div>
        <div class="overlay-stat">
          <p class="meta-label">Best time</p>
          <p class="overlay-stat-value">${bestTimeText}</p>
        </div>
      </div>
      <p class="overlay-best-notice">${isNewBest ? "New best time!" : "Best time stands. Run it back."}</p>
    </div>
    <div class="overlay-actions">
      <button type="button" data-action="restart">Play again</button>
      <button class="secondary-button" type="button" data-action="open-controls">Controls</button>
      <button class="secondary-button" type="button" data-action="open-settings">Settings</button>
    </div>
  `;
}

export function createOverlay() {
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("overlayPanel");
  let currentScreen = "start";
  let backScreen = "start";
  let currentSettings = null;
  let audioSupported = true;
  let roundCompleteData = null;
  let actionHandler = () => {};
  let settingsChangeHandler = () => {};

  function renderCurrentScreen() {
    if (currentScreen === "start") {
      panel.innerHTML = renderStartScreen();
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

    if (currentScreen === "complete" && roundCompleteData) {
      panel.innerHTML = renderRoundCompleteScreen(roundCompleteData);
    }
  }

  function syncSettingsInputs() {
    const soundInput = panel.querySelector('[data-setting="soundEnabled"]');
    const sensitivityInput = panel.querySelector('[data-setting="mouseSensitivity"]');
    const sensitivityValue = panel.querySelector("#overlaySensitivityValue");
    const invertYInput = panel.querySelector('[data-setting="invertY"]');
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
        label.textContent = audioSupported ? (target.checked ? "Sound enabled" : "Sound muted") : "Sound unavailable";
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

    if (settingName === "qualityPreset" && target instanceof HTMLSelectElement) {
      settingsChangeHandler({ qualityPreset: target.value });
    }
  }

  panel.addEventListener("click", handleClick);
  panel.addEventListener("input", handleSettingInput);
  panel.addEventListener("change", handleSettingInput);

  return {
    showStart({ settings, supportsAudio = true }) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      showScreen("start");
    },

    showPause({ settings, supportsAudio = true }) {
      currentSettings = settings;
      audioSupported = supportsAudio;
      showScreen("pause");
    },

    showRoundComplete({ totalTimeText, bestTimeText, isNewBest, settings, supportsAudio = true }) {
      roundCompleteData = { totalTimeText, bestTimeText, isNewBest };
      currentSettings = settings;
      audioSupported = supportsAudio;
      showScreen("complete");
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
