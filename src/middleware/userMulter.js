const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_profileImage',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const userUpload = multer({ storage });

module.exports = userUpload;
