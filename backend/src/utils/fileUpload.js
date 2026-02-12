// This file is to handle file uploads
const multer = require("multer");
const path = require("path");

//Configure multer for memory storage (upload to Supabase from memory)
const storage = multer.memoryStorage();

//File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg,jpg,png,gif,webp) are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;

/*
1- path -> extracts file extensions safely
2- the storage stores the uploaded file in RAM (not on disk)
3- fileFilter decides whether the file should be accepted or not
4- allowedTypes is a Regex that matches allowed image types.
5- path.extname(file.originalname) takes the extension name of a file, changes 
it to lower case, and compares it to the allowedTypes.
6- mimetype ensures a file is actually an image and not renamed to .imageextension.
7- cb is the callback function with the format cb(error,acceptFile), so you can have
cb(null, true) => accepts silently / cb(null,false) => reject silently /
cb(error) reject with error.
*/
