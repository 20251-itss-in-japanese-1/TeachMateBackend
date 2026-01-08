const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log('[CloudinaryStorage] Processing file:', file.originalname);
    console.log('[CloudinaryStorage] File mimetype:', file.mimetype);
    return {
      folder: "uploads",
      resource_type: "auto",
      public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      format: null,
    };
  },
});

const uploadCloud = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log('[Multer fileFilter] Checking file:', file.originalname);
    console.log('[Multer fileFilter] Mimetype:', file.mimetype);
    cb(null, true);
  }
});

console.log('[UploadFile] Multer configured successfully');

module.exports = uploadCloud;
