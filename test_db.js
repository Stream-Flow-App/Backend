const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Audio = require('./models/audio.Model');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/stream_flow');
  const audios = await Audio.find();
  for (const audio of audios) {
    let relativePath = audio.audioUrl;
    if (relativePath.includes('/uploads/audio/')) {
      relativePath = '/uploads/audio/' + relativePath.split('/uploads/audio/')[1];
    }
    const filePath = path.join(__dirname, '..', relativePath);
    console.log(`ID: ${audio._id}`);
    console.log(`Title: ${audio.title}`);
    console.log(`audioUrl in DB: ${audio.audioUrl}`);
    console.log(`Resolved filePath: ${filePath}`);
    console.log(`File exists? ${fs.existsSync(filePath)}`);
    console.log('---');
  }
  process.exit();
}
test();
