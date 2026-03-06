// This file is to handle file uploads
const multer = require("multer");
const path = require("path");

//Configure multer for memory storage (upload to Supabase from memory)
const storage = multer.memoryStorage();

//File filter for images only
const fileFilter = (req, file, cb) => {
  // Allow images
  const imageTypes = /jpeg|jpg|png|gif|webp/;

  // Allow documents
  const documentTypes = /pdf|doc|docx|txt|xls|xlsx|ppt|pptx/;

  // Allow other common types
  const otherTypes = /csv|zip|rar/;

  const extname = path
    .extname(file.originalname)
    .toLowerCase()
    .replace(".", "");
  const mimetype = file.mimetype;

  if (
    imageTypes.test(extname) ||
    documentTypes.test(extname) ||
    otherTypes.test(extname) ||
    mimetype.includes("image") ||
    mimetype.includes("pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("word") ||
    mimetype.includes("excel") ||
    mimetype.includes("powerpoint") ||
    mimetype.includes("text")
  ) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed: images, PDF, Word, Excel, PowerPoint, text files",
      ),
    );
  }
};

// Multer upload instance for single file
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Multer upload instance for multiple files
const uploadArtifacts = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: fileFilter,
});

module.exports = { upload, uploadArtifacts };

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
