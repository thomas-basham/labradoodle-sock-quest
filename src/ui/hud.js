export function createHud() {
  const dogName = document.getElementById("dogName");
  const objectiveText = document.getElementById("objectiveText");
  const sockProgress = document.getElementById("sockProgress");
  const roundTime = document.getElementById("roundTime");
  const bestTime = document.getElementById("bestTime");
  const flavorText = document.getElementById("flavorText");

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

    setFlavor(text) {
      flavorText.textContent = text;
    },
  };
}
