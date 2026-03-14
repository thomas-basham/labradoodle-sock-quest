export function createHud() {
  const objectiveText = document.getElementById("objectiveText");

  return {
    setObjective(text) {
      objectiveText.textContent = text;
    },
  };
}
