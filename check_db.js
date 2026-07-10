const mongoose = require("mongoose");
const PlaylistModel = require("./models/playlist.Model");
require('dotenv').config({ path: '/home/zack-river/Documents/Projects/01-Plans/Stream_Flow/Server/.env' });

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const playlists = await PlaylistModel.find({});
  console.log(playlists.map(p => ({ id: p._id, name: p.name, isAlbum: p.isAlbum, status: p.status })));
  process.exit(0);
});
