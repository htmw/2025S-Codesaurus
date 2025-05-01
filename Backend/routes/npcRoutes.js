const express = require("express");
const router = express.Router();
const { saveNPC, getAllNPC } = require("../controllers/npcController");
const { uploadSingleImage } = require("../controllers/uploadController"); 

//POST route to create a story
router.post("/admin/npc", uploadSingleImage, saveNPC);

//GET Stories from mongodb
router.get("/npcs", getAllNPC);

module.exports = router;
