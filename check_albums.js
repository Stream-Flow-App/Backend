const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Album = require('./models/album.Model.js');
  const albums = await Album.find({});
  console.log('Total albums:', albums.length);
  albums.forEach(a => console.log(`  name="${a.name}" isPublic=${a.isPublic} status="${a.status}"`));
  process.exit();
});
