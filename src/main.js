import { Game } from "./game/Game";

function renderBootstrapError(message) {
  console.error(message);
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div style="position:fixed;inset:16px 16px auto 16px;z-index:10;max-width:420px;padding:16px 18px;border-radius:18px;background:rgba(255,244,204,0.96);border:1px solid rgba(45,29,15,0.16);box-shadow:0 18px 40px rgba(88,55,20,0.18);font-family:Trebuchet MS,Avenir Next,sans-serif;color:#1a1a13;">
        <strong style="display:block;margin-bottom:6px;">Ray's Sock Quest couldn't start</strong>
        <span>${message}</span>
      </div>
    `,
  );
}

const mount = document.getElementById("app");

if (!(mount instanceof HTMLElement)) {
  renderBootstrapError("The game mount element was not found.");
} else {
  const game = new Game({ mount });
  game.start();
}
