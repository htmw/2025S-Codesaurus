const express = require("express");
const router = express.Router();
const { uploadSingleImage, handleImageUpload } = require("../controllers/uploadController");

// Route to upload NPC image
router.post("/upload-npc-image", uploadSingleImage, handleImageUpload);

module.exports = router;
