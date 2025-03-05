const express = require("express");
const { startGame, playTurn, getGameState } = require("../controllers/narratorController");

const router = express.Router();

// Start a new game session
router.post("/start-game", startGame);

// Handle player input and return AI narration
router.post("/play-turn", playTurn);

// Fetch current game state
router.get("/game-state/:playerId", getGameState);

module.exports = router;
