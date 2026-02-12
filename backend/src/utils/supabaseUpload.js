/*This file is to upload to supabase after the file has been validated and processed
by Multer
*/
const supabase = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const uploadToSupabase = async (file, bucketName) => {
  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;

    //Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (error) {
    throw error;
  }
};

module.exports = { uploadToSupabase };

/*
1- first, we extract the extension of the file and pair it with a random string
of characters so that collisions and over-writing do not occur.
2- Next, we upload to a specific bucketName and after that get the publicUrl of the file
which does not need await, because it is local building of the Url and does not talk with the servers.

*/
