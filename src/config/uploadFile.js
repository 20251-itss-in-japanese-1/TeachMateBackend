const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const slugify = require('slugify'); 
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

function normalizeOriginalName(original) {
  if (!original) return 'file';
  let decoded = original;
  try {
    if (/%[0-9A-Fa-f]{2}/.test(original)) {
      decoded = decodeURIComponent(original);
    }
  } catch (e) {
    decoded = original;
  }
  decoded = path.basename(decoded);

  return decoded;
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const original = normalizeOriginalName(file.originalname);
    const ext = path.extname(original); 
    const base = path.basename(original, ext); 
    const safeBase = slugify(base, {
      replacement: '-',   
      remove: /[*+~.()'"!:@]/g,
      lower: false,
      strict: true
    });
    const publicId = `${Date.now()}_${safeBase || 'file'}`;

    return {
      folder: 'uploads',
      resource_type: 'auto',
      public_id: publicId
    };
  }
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;
