const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/user.Model');
const Audio = require('./models/audio.Model');

dotenv.config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stream_flow';

// We use royalty-free audio tracks as placeholders for the actual songs
const artistsToSeed = [
  {
    name: 'The Weeknd',
    username: 'theweeknd',
    email: 'theweeknd@streamflow.com',
    profileImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/The_Weeknd_Cannes_2023.jpg/440px-The_Weeknd_Cannes_2023.jpg',
    songs: [
      {
        title: 'Blinding Lights (Placeholder)',
        genre: 'Synth-Pop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png',
        duration: 200,
      },
      {
        title: 'Save Your Tears (Placeholder)',
        genre: 'Pop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/bd/The_Weeknd_-_Save_Your_Tears.png',
        duration: 215,
      }
    ]
  },
  {
    name: 'Taylor Swift',
    username: 'taylorswift',
    email: 'taylor@streamflow.com',
    profileImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/440px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
    songs: [
      {
        title: 'Anti-Hero (Placeholder)',
        genre: 'Pop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/04/Taylor_Swift_-_Anti-Hero.png',
        duration: 196,
      },
      {
        title: 'Cruel Summer (Placeholder)',
        genre: 'Pop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/93/Taylor_Swift_-_Cruel_Summer.png',
        duration: 178,
      }
    ]
  },
  {
    name: 'Drake',
    username: 'drake',
    email: 'drake@streamflow.com',
    profileImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Drake_July_2016.jpg/440px-Drake_July_2016.jpg',
    songs: [
      {
        title: 'Gods Plan (Placeholder)',
        genre: 'Hip-Hop',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/90/Scorpion_by_Drake.jpg',
        duration: 198,
      }
    ]
  }
];

async function seed() {
  try {
    console.log('Connecting to database:', DB_URI);
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB.\n');

    const password = await bcrypt.hash('Password@123', 12);

    for (const artistData of artistsToSeed) {
      console.log(`Processing Artist: ${artistData.name}`);

      // Create or update artist user
      let user = await User.findOne({ email: artistData.email });
      if (!user) {
        user = new User({
          name: artistData.name,
          username: artistData.username,
          email: artistData.email,
          password: password,
          role: 'artist',
          profileImg: artistData.profileImg
        });
        await user.save();
        console.log(`  - Created user: ${artistData.username}`);
      } else {
        user.role = 'artist';
        user.profileImg = artistData.profileImg;
        user.password = password;
        await user.save();
        console.log(`  - Updated existing user: ${artistData.username}`);
      }

      // Create songs for artist
      for (const songData of artistData.songs) {
        const existingSong = await Audio.findOne({ title: songData.title, uploadedBy: user._id });
        if (!existingSong) {
          const audio = new Audio({
            title: songData.title,
            category: 'song',
            genre: songData.genre,
            singer: artistData.name,
            duration: songData.duration,
            audioUrl: songData.audioUrl,
            coverImageUrl: songData.coverImageUrl,
            uploadedBy: user._id,
            isPrivate: false,
            status: 'approved',
            listenTimes: Math.floor(Math.random() * 5000), // Seed with random stats
            totalListenSeconds: Math.floor(Math.random() * 100000)
          });
          await audio.save();
          console.log(`    -> Uploaded song: ${songData.title}`);
        } else {
          console.log(`    -> Song already exists: ${songData.title}`);
        }
      }
      console.log('-----------------------------------');
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
