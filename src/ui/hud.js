function pulseElement(element) {
  if (!element) {
    return;
  }

  element.classList.remove("ui-pop");
  // Force a reflow so repeated score changes still retrigger the animation.
  void element.offsetWidth;
  element.classList.add("ui-pop");
}

function setText(element, text) {
  if (element) {
    element.textContent = text;
  }
}

function setStyle(element, property, value) {
  if (element) {
    element.style[property] = value;
  }
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
      setText(dogName, text);
    },

    setLevel(text) {
      setText(levelIndicator, text);
    },

    setObjective(text) {
      setText(objectiveText, text);
    },

    setProgress(returnedCount, totalSocks) {
      if (returnedCount > lastReturnedCount) {
        pulseElement(sockProgress);
      }

      lastReturnedCount = returnedCount;
      setText(sockProgress, `${returnedCount} / ${totalSocks}`);
    },

    setRoundTime(text) {
      setText(roundTime, text);
    },

    setBestTime(text) {
      setText(bestTime, text);
    },

    setScore(text) {
      if (text !== lastScoreText) {
        pulseElement(scoreValue);
      }

      lastScoreText = text;
      setText(scoreValue, text);
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
      setText(comboLabel, combo.label);
      setText(comboDetail, combo.detail);
      lastComboLabel = combo.label;

      if (shouldPulse) {
        pulseElement(comboChip);
      }
    },

    setSniffHint(text) {
      setText(sniffHint, text);
    },

    setSniffCooldown(remainingMs, cooldownMs) {
      const progress = cooldownMs === 0 ? 1 : Math.max(0, Math.min(1, 1 - remainingMs / cooldownMs));
      setStyle(sniffCooldownFill, "transform", `scaleX(${progress})`);
      setText(sniffCooldownText, remainingMs > 0 ? `${(remainingMs / 1000).toFixed(1)}s` : "Ready");
    },

    setFlavor(text) {
      setText(flavorText, text);
    },

    setHazardStatus({ badge, title, detail }) {
      setText(hazardBadge, badge);
      setText(hazardTitle, title);
      setText(hazardText, detail);
    },

    setSprinklerOverlay(intensity) {
      setStyle(sprinklerOverlay, "opacity", intensity.toFixed(3));
    },

    setSoundEnabled(enabled, supported = true) {
      if (!soundToggleButton) {
        return;
      }

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
