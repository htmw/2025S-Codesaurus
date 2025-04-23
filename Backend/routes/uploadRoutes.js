// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../s3"); 

// Set up multer to upload to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = `npc-images/${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

// Route to upload image
router.post("/upload-npc-image", upload.single("image"), (req, res) => {
    res.json({
      message: "Upload successful",
      imageUrl: req.file.location,
    });
  });
  
  module.exports = router;
  