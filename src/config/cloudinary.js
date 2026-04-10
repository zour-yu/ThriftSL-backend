const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "degtucawm",
  api_key: "636782364436499",
  api_secret: "P_-gsdnz4m49vJ9toZdn_9Nk2mE"
});

module.exports = cloudinary;