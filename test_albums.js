const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Album = require('./models/album.Model.js');
  const albums = await Album.find({});
  console.log('Albums found:', albums.length);
  if (albums.length > 0) {
    console.log(albums.map(a => ({ name: a.name, owner: a.owner })));
  }
  process.exit();
});
