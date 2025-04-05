const express = require("express");
const router = express.Router();
const { createCharacter, getCharacters, getCharacterByName } = require("../controllers/characterController");

// Route to create a character
router.post("/characters", createCharacter);

// Route to get all characters
router.get("/characters", getCharacters);

// Route to get all characters
router.get("/characters/:name", getCharacterByName);


module.exports = router;
