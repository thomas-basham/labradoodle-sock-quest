export function createHud() {
  const dogName = document.getElementById("dogName");
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

  return {
    setName(text) {
      dogName.textContent = text;
    },

    setObjective(text) {
      objectiveText.textContent = text;
    },

    setProgress(returnedCount, totalSocks) {
      sockProgress.textContent = `${returnedCount} / ${totalSocks}`;
    },

    setRoundTime(text) {
      roundTime.textContent = text;
    },

    setBestTime(text) {
      bestTime.textContent = text;
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
  };
}
