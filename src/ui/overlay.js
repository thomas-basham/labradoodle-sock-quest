import { OVERLAY_COPY } from "../game/config";

export function createOverlay() {
  const overlay = document.getElementById("overlay");
  const title = document.getElementById("overlayTitle");
  const body = document.getElementById("overlayBody");
  const button = document.getElementById("overlayButton");

  function applyContent(content) {
    title.textContent = content.title;
    body.textContent = content.body;
    button.textContent = content.buttonLabel;
  }

  return {
    showIntro() {
      applyContent(OVERLAY_COPY.intro);
      overlay.classList.remove("hidden");
    },

    showWin() {
      applyContent(OVERLAY_COPY.win);
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
