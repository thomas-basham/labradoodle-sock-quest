export function createHud() {
  const dogName = document.getElementById("dogName");
  const objectiveText = document.getElementById("objectiveText");
  const sockCount = document.getElementById("sockCount");
  const flavorText = document.getElementById("flavorText");

  return {
    setName(text) {
      dogName.textContent = text;
    },

    setObjective(text) {
      objectiveText.textContent = text;
    },

    setCollected(count) {
      sockCount.textContent = String(count);
    },

    setFlavor(text) {
      flavorText.textContent = text;
    },
  };
}
