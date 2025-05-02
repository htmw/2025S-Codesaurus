const express = require("express");
const multer = require("multer");
const { transcribeAudio, synthesizeSpeech } = require("../controllers/voiceController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Speech-to-Text: upload audio file
router.post("/transcribe", upload.single("file"), transcribeAudio);

// Text-to-Speech: generate audio from text
router.post("/synthesize", synthesizeSpeech);

module.exports = router;
