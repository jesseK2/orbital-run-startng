import "./style.css";
import { OrbitalRun } from "./game.js";
import {
  getPreviewPlayer,
  startNgSignIn,
  watchStartNgPlayer,
} from "./startng.js";

const elements = {
  stage: document.querySelector("#three-stage"),
  overlay: document.querySelector("#overlay"),
  overlayLabel: document.querySelector("#overlay-label"),
  overlayTitle: document.querySelector("#overlay-title"),
  overlayCopy: document.querySelector("#overlay-copy"),
  startButton: document.querySelector("#start-button"),
  playerName: document.querySelector("#player-name"),
  playerAccount: document.querySelector("#player-account"),
  playerFace: document.querySelector("#player-face"),
  signIn: document.querySelector("#sign-in"),
  distance: document.querySelector("#distance"),
  stardust: document.querySelector("#stardust"),
  best: document.querySelector("#best"),
  error: document.querySelector("#connection-error"),
  moveLeft: document.querySelector("#move-left"),
  moveRight: document.querySelector("#move-right"),
};

let player = null;
let game = null;
let disposePlayerWatch = () => {};
let gameState = "loading";
const bestKey = "orbital-run-best";

function setBest(distance) {
  const currentBest = Number(localStorage.getItem(bestKey) || 0);
  const nextBest = Math.max(currentBest, distance);
  localStorage.setItem(bestKey, String(nextBest));
  elements.best.innerHTML = `${nextBest} <small>m</small>`;
}

function updateScore({ distance, stardust, gameOver = false }) {
  elements.distance.innerHTML = `${distance} <small>m</small>`;
  elements.stardust.textContent = String(stardust);

  if (gameOver) {
    setBest(distance);
    gameState = "game-over";
    elements.overlayLabel.textContent = "RUN COMPLETE";
    elements.overlayTitle.textContent = "Out of orbit.";
    elements.overlayCopy.textContent =
      `You travelled ${distance} metres and found ${stardust} stardust. Ready for another run?`;
    elements.startButton.innerHTML =
      '<span>Run it back</span><span aria-hidden="true">↗</span>';
    elements.overlay.hidden = false;
  }
}

function updatePlayer(nextPlayer) {
  player = nextPlayer;
  elements.playerName.textContent = player.name;
  elements.playerAccount.textContent = player.isGuest
    ? "Guest pilot"
    : `@${player.account || "pilot"}`;
  elements.playerFace.hidden = !player.face;
  if (player.face) elements.playerFace.src = player.face;
  elements.signIn.hidden = !player.isGuest;
  elements.error.hidden = true;

  if (!game) {
    try {
      game = new OrbitalRun(elements.stage, updateScore);
    } catch (error) {
      console.error("Unable to start the 3D game:", error);
      showConnectionError(
        "This browser could not start the 3D game. Try enabling WebGL or using a recent browser.",
        false
      );
      return;
    }
  }

  game.setCharacter(player.style);
  if (gameState === "loading") {
    gameState = "ready";
    elements.startButton.disabled = false;
    elements.startButton.innerHTML =
      '<span>Start your run</span><span aria-hidden="true">↗</span>';
    elements.overlayLabel.textContent = player.isGuest
      ? "GUEST PILOT · CHARACTER READY"
      : "YOUR START.NG CHARACTER IS READY";
  }
}

function showConnectionError(message, canRetry = true) {
  elements.playerName.textContent = "Character unavailable";
  elements.playerAccount.textContent = "Could not connect to Start.ng";
  elements.error.textContent = message;
  elements.error.hidden = false;
  elements.startButton.disabled = !canRetry;
  elements.overlayLabel.textContent = "CONNECTION INTERRUPTED";
  elements.overlayTitle.textContent = "Waiting on Start.ng.";
  elements.overlayCopy.textContent =
    "Reconnect to load your saved character and start playing.";
  elements.startButton.innerHTML =
    '<span>Retry connection</span><span aria-hidden="true">↻</span>';
  gameState = "loading";
}

function handlePlayerError(error) {
  console.error("Start.ng connection failed:", error);
  if (player) {
    elements.error.textContent =
      "Could not refresh your character from Start.ng. Your current run is still available.";
    elements.error.hidden = false;
    return;
  }
  showConnectionError(error.message);
}

function movePlayer(direction) {
  game?.move(direction);
}

elements.startButton.addEventListener("click", () => {
  if (gameState === "loading") {
    disposePlayerWatch();
    disposePlayerWatch = watchStartNgPlayer(updatePlayer, handlePlayerError);
    return;
  }

  if (!player || !game) return;
  gameState = "playing";
  elements.overlay.hidden = true;
  game.start();
});

elements.signIn.addEventListener("click", (event) => {
  event.preventDefault();
  startNgSignIn();
});
elements.moveLeft.addEventListener("click", () => movePlayer(-1));
elements.moveRight.addEventListener("click", () => movePlayer(1));

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    movePlayer(-1);
  } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    movePlayer(1);
  } else if (event.key === " " && gameState !== "playing") {
    event.preventDefault();
    elements.startButton.click();
  }
});

elements.best.innerHTML = `${Number(localStorage.getItem(bestKey) || 0)} <small>m</small>`;

if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview")) {
  updatePlayer(getPreviewPlayer());
} else {
  disposePlayerWatch = watchStartNgPlayer(updatePlayer, handlePlayerError);
}

window.addEventListener("pagehide", () => {
  disposePlayerWatch();
  game?.dispose();
});
