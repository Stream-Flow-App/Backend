const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const files = [
  '/home/zack-river/.gemini/antigravity-ide/brain/7392b6f9-6642-428f-bc91-297b103d4dd0/genre_pop_1783607522328.png',
  '/home/zack-river/.gemini/antigravity-ide/brain/7392b6f9-6642-428f-bc91-297b103d4dd0/genre_hiphop_1783607530929.png',
  '/home/zack-river/.gemini/antigravity-ide/brain/7392b6f9-6642-428f-bc91-297b103d4dd0/genre_rnb_1783607539639.png',
  '/home/zack-river/.gemini/antigravity-ide/brain/7392b6f9-6642-428f-bc91-297b103d4dd0/artist_placeholder_1783607549347.png'
];

async function uploadAll() {
  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file, { folder: 'streamflow/genres' });
      console.log(file.split('/').pop() + ' -> ' + result.secure_url);
    } catch (e) {
      console.error('Error uploading', file, e.message);
    }
  }
}

uploadAll();
