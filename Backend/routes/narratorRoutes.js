const express = require("express");
const { startGame, playTurn, getGameState, completeGame, getChoicesForSession, rollDice } = require("../controllers/narratorController");

const router = express.Router();

router.post("/start-game", startGame);
router.post("/play-turn", playTurn);
router.get("/game-state/:sessionId", getGameState);
router.post("/end-game", completeGame);
router.get("/game-choices/:sessionId", getChoicesForSession);
router.post("/roll-dice", rollDice);

module.exports = router;
