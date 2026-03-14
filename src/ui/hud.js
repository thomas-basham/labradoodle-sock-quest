function pulseElement(element) {
  element.classList.remove("ui-pop");
  // Force a reflow so repeated score changes still retrigger the animation.
  void element.offsetWidth;
  element.classList.add("ui-pop");
}

export function createHud() {
  const dogName = document.getElementById("dogName");
  const levelIndicator = document.getElementById("levelIndicator");
  const scoreValue = document.getElementById("scoreValue");
  const comboChip = document.getElementById("comboChip");
  const comboLabel = document.getElementById("comboLabel");
  const comboDetail = document.getElementById("comboDetail");
  const objectiveText = document.getElementById("objectiveText");
  const sockProgress = document.getElementById("sockProgress");
  const roundTime = document.getElementById("roundTime");
  const bestTime = document.getElementById("bestTime");
  const sniffHint = document.getElementById("sniffHint");
  const sniffCooldownFill = document.getElementById("sniffCooldownFill");
  const sniffCooldownText = document.getElementById("sniffCooldownText");
  const flavorText = document.getElementById("flavorText");
  const hazardBadge = document.getElementById("hazardBadge");
  const hazardTitle = document.getElementById("hazardTitle");
  const hazardText = document.getElementById("hazardText");
  const sprinklerOverlay = document.getElementById("sprinklerOverlay");
  const soundToggleButton = document.getElementById("soundToggleButton");
  const menuButton = document.getElementById("menuButton");
  let lastReturnedCount = 0;
  let lastScoreText = "";
  let lastComboLabel = "";

  return {
    setName(text) {
      dogName.textContent = text;
    },

    setLevel(text) {
      if (levelIndicator) {
        levelIndicator.textContent = text;
      }
    },

    setObjective(text) {
      objectiveText.textContent = text;
    },

    setProgress(returnedCount, totalSocks) {
      if (returnedCount > lastReturnedCount) {
        pulseElement(sockProgress);
      }

      lastReturnedCount = returnedCount;
      sockProgress.textContent = `${returnedCount} / ${totalSocks}`;
    },

    setRoundTime(text) {
      roundTime.textContent = text;
    },

    setBestTime(text) {
      bestTime.textContent = text;
    },

    setScore(text) {
      if (text !== lastScoreText) {
        pulseElement(scoreValue);
      }

      lastScoreText = text;
      scoreValue.textContent = text;
    },

    setCombo(combo) {
      if (!comboChip || !comboLabel || !comboDetail) {
        return;
      }

      if (!combo) {
        comboChip.hidden = true;
        lastComboLabel = "";
        return;
      }

      const shouldPulse = comboChip.hidden || combo.label !== lastComboLabel;
      comboChip.hidden = false;
      comboLabel.textContent = combo.label;
      comboDetail.textContent = combo.detail;
      lastComboLabel = combo.label;

      if (shouldPulse) {
        pulseElement(comboChip);
      }
    },

    setSniffHint(text) {
      sniffHint.textContent = text;
    },

    setSniffCooldown(remainingMs, cooldownMs) {
      const progress = cooldownMs === 0 ? 1 : Math.max(0, Math.min(1, 1 - remainingMs / cooldownMs));
      sniffCooldownFill.style.transform = `scaleX(${progress})`;
      sniffCooldownText.textContent = remainingMs > 0 ? `${(remainingMs / 1000).toFixed(1)}s` : "Ready";
    },

    setFlavor(text) {
      flavorText.textContent = text;
    },

    setHazardStatus({ badge, title, detail }) {
      hazardBadge.textContent = badge;
      hazardTitle.textContent = title;
      hazardText.textContent = detail;
    },

    setSprinklerOverlay(intensity) {
      sprinklerOverlay.style.opacity = intensity.toFixed(3);
    },

    setSoundEnabled(enabled, supported = true) {
      soundToggleButton.disabled = !supported;
      soundToggleButton.setAttribute("aria-pressed", String(enabled));
      soundToggleButton.textContent = supported ? (enabled ? "Sound On" : "Sound Off") : "Sound N/A";
    },

    onSoundToggle(handler) {
      if (!soundToggleButton) {
        return () => {};
      }

      soundToggleButton.addEventListener("click", handler);
      return () => {
        soundToggleButton.removeEventListener("click", handler);
      };
    },

    onMenu(handler) {
      if (!menuButton) {
        return () => {};
      }

      menuButton.addEventListener("click", handler);
      return () => {
        menuButton.removeEventListener("click", handler);
      };
    },
  };
}
