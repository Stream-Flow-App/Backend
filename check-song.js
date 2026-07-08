const mongoose = require('mongoose');
const Audio = require('./models/audio.Model');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/stream_flow');
  const audios = await Audio.find({ title: { $regex: /name/i } });
  console.log("Audios:", audios);
  mongoose.disconnect();
}
test();
