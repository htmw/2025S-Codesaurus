const express = require("express");
const router = express.Router();
const { saveNPC, getAllNPC } = require("../controllers/npcController");
const { uploadSingleImage } = require("../controllers/uploadController"); 
const { updateNPCImage } = require("../controllers/npcController");

//POST route to create a story
router.post("/admin/npc", uploadSingleImage, saveNPC);

//GET Stories from mongodb
router.get("/npcs", getAllNPC);

//PUT route to update the image of an NPC
router.put("/admin/npc/:npcId/image", uploadSingleImage, updateNPCImage);

module.exports = router;
