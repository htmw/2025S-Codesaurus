const express = require("express");
const router = express.Router();
const { saveNPC, getAllNPC } = require("../controllers/npcController"); 

//POST route to create a story
router.post("/npc", saveNPC);

//GET Stories from mongodb
router.get("/npcs", getAllNPC);

module.exports = router;
