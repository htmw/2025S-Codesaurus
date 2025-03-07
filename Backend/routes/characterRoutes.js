const express = require("express");
const router = express.Router();
const { createCharacter, getCharacters } = require("../controllers/characterController");

// Route to create a character
router.post("/characters", createCharacter);

// Route to get all characters
router.get("/characters", getCharacters);

module.exports = router;
