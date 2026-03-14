import { Game } from "./game/Game";

const mount = document.getElementById("app");
const game = new Game({ mount });

game.start();
