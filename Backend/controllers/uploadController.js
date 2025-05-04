const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

// Uses npcId from URL to name the file: npc-images/<npcId>.png
const uploadSingleImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const npcId = req.params.npcId;
      const extension = file.originalname.split('.').pop();
      const fileName = `npc-images/${npcId}.${extension}`;
      cb(null, fileName);
    },
  }),
}).single("image");

const handleImageUpload = async (req, res) => {
  const npcId = req.params.npcId;
  const imageUrl = req.file?.location;

  if (!imageUrl) {
    return res.status(400).json({ message: "Upload failed" });
  }

  // Update NPC with new imageUrl in MongoDB
  const NPC = require("../models/NPC");
  const updatedNPC = await NPC.findByIdAndUpdate(
    npcId,
    { imageUrl },
    { new: true }
  );

  if (!updatedNPC) {
    return res.status(404).json({ message: "NPC not found" });
  }

  res.status(200).json({
    message: "Upload successful",
    npc: updatedNPC,
  });
};

module.exports = { uploadSingleImage, handleImageUpload };
