import { OVERLAY_COPY } from "../game/config";

export function createOverlay() {
  const overlay = document.getElementById("overlay");
  const title = document.getElementById("overlayTitle");
  const body = document.getElementById("overlayBody");
  const button = document.getElementById("overlayButton");
  const summary = document.getElementById("overlaySummary");
  const totalTime = document.getElementById("overlayTime");
  const bestTime = document.getElementById("overlayBestTime");
  const bestNotice = document.getElementById("overlayBestNotice");

  function applyContent(content) {
    title.textContent = content.title;
    body.textContent = content.body;
    button.textContent = content.buttonLabel;
  }

  function hideSummary() {
    summary.classList.add("hidden");
  }

  return {
    showIntro() {
      applyContent(OVERLAY_COPY.intro);
      hideSummary();
      overlay.classList.remove("hidden");
    },

    showRoundComplete({ totalTimeText, bestTimeText, isNewBest }) {
      applyContent(OVERLAY_COPY.complete);
      totalTime.textContent = totalTimeText;
      bestTime.textContent = bestTimeText;
      bestNotice.textContent = isNewBest ? "New best time!" : "Best time stands. Run it back.";
      summary.classList.remove("hidden");
      overlay.classList.remove("hidden");
    },

    hide() {
      overlay.classList.add("hidden");
    },

    onAction(handler) {
      button.addEventListener("click", handler);
      return () => button.removeEventListener("click", handler);
    },
  };
}
