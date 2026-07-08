const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

require('dotenv').config();
const User = require('./models/user.Model');
const Audio = require('./models/audio.Model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stream_flow';

const songsToSeed = [
  {
    title: 'SoundHelix Song 1',
    genre: 'Electronic',
    singer: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://picsum.photos/400/400?random=1',
    duration: 372000 // 6m12s
  },
  {
    title: 'SoundHelix Song 2',
    genre: 'Pop',
    singer: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://picsum.photos/400/400?random=2',
    duration: 425000 // 7m05s
  },
  {
    title: 'SoundHelix Song 3',
    genre: 'Classical',
    singer: 'SoundHelix',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://picsum.photos/400/400?random=3',
    duration: 344000 // 5m44s
  }
];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const zack = await User.findOne({ username: 'zackriver' });
    if (!zack) {
      console.log('User zackriver not found');
      process.exit(1);
    }

    const uploadsDir = path.join(__dirname, 'uploads', 'audio');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const song of songsToSeed) {
      console.log(`Downloading ${song.title}...`);
      
      const audioFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-audio.mp3`;
      const coverFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-cover.jpg`;
      
      const audioPath = path.join(uploadsDir, audioFilename);
      const coverPath = path.join(uploadsDir, coverFilename);

      await downloadFile(song.audioUrl, audioPath);
      console.log(`- Downloaded audio: ${audioFilename}`);
      
      await downloadFile(song.coverUrl, coverPath);
      console.log(`- Downloaded cover: ${coverFilename}`);

      const newAudio = new Audio({
        title: song.title,
        category: 'song',
        genre: song.genre,
        singer: song.singer,
        duration: song.duration,
        audioUrl: `/uploads/audio/${audioFilename}`,
        coverImageUrl: `/uploads/audio/${coverFilename}`,
        uploadedBy: zack._id,
        isPrivate: false
      });

      await newAudio.save();
      console.log(`Saved ${song.title} to DB`);
    }

    console.log('Done seeding!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
