const express = require("express");
const { startGame, playTurn, getGameState, completeGame, getChoicesForSession } = require("../controllers/narratorController");

const router = express.Router();

router.post("/start-game", startGame);
router.post("/play-turn", playTurn);
router.get("/game-state/:playerId", getGameState);
router.post("/end-game", completeGame);
router.get("/game-choices/:sessionId", getChoicesForSession);

module.exports = router;
