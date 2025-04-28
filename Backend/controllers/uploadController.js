const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");

// Configure the upload using multerS3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `npc-images/${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

const uploadSingleImage = upload.single("image");

// Controller to handle the response
const handleImageUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({
    message: "Upload successful",
    imageUrl: req.file.location,
  });
};

module.exports = { uploadSingleImage, handleImageUpload };
