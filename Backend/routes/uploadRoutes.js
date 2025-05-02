const express = require("express");
const router = express.Router();
const { uploadSingleImage, handleImageUpload } = require("../controllers/uploadController");

// Route to upload NPC image with id
router.put("/upload-npc-image/:npcId", uploadSingleImage, handleImageUpload);


module.exports = router;
