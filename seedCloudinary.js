const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const User = require('./models/user.Model');
const Audio = require('./models/audio.Model');
const Playlist = require('./models/playlist.Model');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soundwave';

const artists = [
  {
    name: 'The Weeknd',
    username: 'theweeknd',
    email: 'theweeknd@streamflow.com',
    profileImgUrl: 'theweeknd.jpg',
    albumName: 'After Hours',
    albumCover: 'theweeknd_cover.png',
    songs: [
      { title: 'Blinding Lights', genre: 'Synth-Pop', coverUrl: 'theweeknd_cover.png', audioFile: 'Blinding_Lights.mp3', duration: 200 },
      { title: 'Starboy', genre: 'R&B', coverUrl: 'starboy_cover.jpg', audioFile: 'Starboy.mp3', duration: 230 }
    ]
  },
  {
    name: 'Taylor Swift',
    username: 'taylorswift',
    email: 'taylor@streamflow.com',
    profileImgUrl: 'taylorswift.png',
    albumName: 'Lover',
    albumCover: 'taylorswift_cover.png',
    songs: [
      { title: 'Cruel Summer', genre: 'Pop', coverUrl: 'taylorswift_cover.png', audioFile: 'Cruel_Summer.mp3', duration: 178 },
      { title: 'Lover', genre: 'Pop', coverUrl: 'lover_cover.jpg', audioFile: 'Lover.mp3', duration: 221 },
      { title: 'Anti-Hero', genre: 'Pop', coverUrl: 'antihero_cover.jpg', audioFile: 'Anti_Hero.mp3', duration: 200 }
    ]
  },
  {
    name: 'Drake',
    username: 'drake',
    email: 'drake@streamflow.com',
    profileImgUrl: 'drake.jpg',
    albumName: 'Scorpion',
    albumCover: 'drake_cover.jpg',
    songs: [
      { title: "God's Plan", genre: 'Hip-Hop', coverUrl: 'drake_cover.jpg', audioFile: 'Gods_Plan.mp3', duration: 198 },
      { title: 'Nice For What', genre: 'Hip-Hop', coverUrl: 'niceforwhat_cover.jpg', audioFile: 'Nice_For_What.mp3', duration: 210 },
      { title: 'Hotline Bling', genre: 'Hip-Hop', coverUrl: 'hotlinebling_cover.jpg', audioFile: 'Hotline_Bling.mp3', duration: 267 }
    ]
  },
  {
    name: 'Billie Eilish',
    username: 'billieeilish',
    email: 'billie@streamflow.com',
    profileImgUrl: 'billieeilish.jpg',
    albumName: 'When We All Fall Asleep',
    albumCover: 'billieeilish_cover.png',
    songs: [
      { title: 'bad guy', genre: 'Alternative Pop', coverUrl: 'billieeilish_cover.png', audioFile: 'Bad_Guy.mp3', duration: 194 },
      { title: 'bury a friend', genre: 'Alternative Pop', coverUrl: 'buryafriend_cover.jpg', audioFile: 'Bury_A_Friend.mp3', duration: 193 },
      { title: 'Therefore I Am', genre: 'Alternative Pop', coverUrl: 'thereforeiam_cover.jpg', audioFile: 'Therefore_I_Am.mp3', duration: 174 }
    ]
  },
  {
    name: 'Post Malone',
    username: 'postmalone',
    email: 'posty@streamflow.com',
    profileImgUrl: 'postmalone.png',
    albumName: "Hollywood's Bleeding",
    albumCover: 'postmalone_cover.png',
    songs: [
      { title: 'Sunflower', genre: 'Pop Rap', coverUrl: 'postmalone_cover.png', audioFile: 'Sunflower.mp3', duration: 158 },
      { title: 'Circles', genre: 'Pop Rap', coverUrl: 'circles_cover.jpg', audioFile: 'Circles.mp3', duration: 215 }
    ]
  },
  {
    name: 'Eminem',
    username: 'eminem',
    email: 'eminem@streamflow.com',
    profileImgUrl: 'eminem.jpg',
    albumName: 'The Eminem Show',
    albumCover: 'withoutme_cover.jpg',
    songs: [
      { title: 'Without Me', genre: 'Rap', coverUrl: 'withoutme_cover.jpg', audioFile: 'Without_Me.mp3', duration: 290 },
      { title: 'Superman', genre: 'Rap', coverUrl: 'superman_cover.jpg', audioFile: 'Superman.mp3', duration: 350 }
    ]
  },
  {
    name: 'Dua Lipa',
    username: 'dualipa',
    email: 'dualipa@streamflow.com',
    profileImgUrl: 'dualipa.jpg',
    albumName: 'Future Nostalgia',
    albumCover: 'levitating_cover.jpg',
    songs: [
      { title: 'Levitating', genre: 'Pop', coverUrl: 'levitating_cover.jpg', audioFile: 'Levitating.mp3', duration: 203 },
      { title: "Don't Start Now", genre: 'Pop', coverUrl: 'dontstartnow_cover.jpg', audioFile: 'Dont_Start_Now.mp3', duration: 183 }
    ]
  },
  {
    name: 'Ed Sheeran',
    username: 'edsheeran',
    email: 'edsheeran@streamflow.com',
    profileImgUrl: 'edsheeran.jpg',
    albumName: 'Divide',
    albumCover: 'shapeofyou_cover.jpg',
    songs: [
      { title: 'Shape of You', genre: 'Pop', coverUrl: 'shapeofyou_cover.jpg', audioFile: 'Shape_Of_You.mp3', duration: 233 },
      { title: 'Perfect', genre: 'Pop', coverUrl: 'perfect_cover.jpg', audioFile: 'Perfect.mp3', duration: 263 }
    ]
  },
  {
    name: 'Ariana Grande',
    username: 'arianagrande',
    email: 'ariana@streamflow.com',
    profileImgUrl: 'arianagrande.jpg',
    albumName: 'thank u, next',
    albumCover: 'thankunext_cover.jpg',
    songs: [
      { title: '7 rings', genre: 'Pop', coverUrl: '7rings_cover.jpg', audioFile: '7_rings.mp3', duration: 178 },
      { title: 'thank u, next', genre: 'Pop', coverUrl: 'thankunext_cover.jpg', audioFile: 'thank_u_next.mp3', duration: 207 }
    ]
  },
  {
    name: 'Bruno Mars',
    username: 'brunomars',
    email: 'bruno@streamflow.com',
    profileImgUrl: 'brunomars.jpg',
    albumName: '24K Magic',
    albumCover: 'thatswhatilike_cover.jpg',
    songs: [
      { title: "That's What I Like", genre: 'R&B', coverUrl: 'thatswhatilike_cover.jpg', audioFile: 'Thats_What_I_Like.mp3', duration: 206 },
      { title: 'Locked Out Of Heaven', genre: 'Pop', coverUrl: 'lockedoutofheaven_cover.jpg', audioFile: 'Locked_Out_Of_Heaven.mp3', duration: 233 }
    ]
  }
];

async function uploadToCloudinary(filePathOrUrl, folder, resourceType = 'auto') {
  try {
    const result = await cloudinary.uploader.upload(filePathOrUrl, {
      folder: `streamflow/${folder}`,
      resource_type: resourceType
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Failed to upload ${filePathOrUrl} to Cloudinary:`, error);
    throw error;
  }
}

async function seed() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB.\n');

    const password = await bcrypt.hash('Password@123', 12);

    for (const artistData of artists) {
      console.log(`\n🎤 Processing Artist: ${artistData.name}`);

      // 1. Upload Profile Image
      let profileImgUrl = "https://picsum.photos/400"; // fallback
      try {
        console.log(`   [Upload] Profile Image...`);
        const profileImgPath = path.join(__dirname, 'temp_audio', artistData.profileImgUrl);
        if (fs.existsSync(profileImgPath)) {
          profileImgUrl = await uploadToCloudinary(profileImgPath, 'profiles', 'image');
        } else {
          console.log(`   ⚠️ File ${profileImgPath} not found, using placeholder`);
        }
      } catch(err) {
        console.log(`   ⚠️ Failed profile upload, using placeholder`);
      }

      // 2. Create User
      let user = await User.findOne({ email: artistData.email });
      if (!user) {
        user = new User({
          name: artistData.name,
          username: artistData.username,
          email: artistData.email,
          password: password,
          role: 'artist',
          profileImg: profileImgUrl
        });
        await user.save();
        console.log(`   ✅ Created User`);
      } else {
        user.profileImg = profileImgUrl;
        await user.save();
        console.log(`   ✅ Updated existing User`);
      }

      const songIds = [];

      // 3. Process Songs
      for (const songData of artistData.songs) {
        let existingSong = await Audio.findOne({ title: songData.title, uploadedBy: user._id });
        if (!existingSong) {
          const audioFilePath = path.join(__dirname, 'temp_audio', songData.audioFile);
          
          if (!fs.existsSync(audioFilePath)) {
            console.error(`   ❌ Audio file missing: ${audioFilePath}`);
            continue;
          }

          console.log(`   [Upload] Audio track (${songData.title})...`);
          const uploadedAudioUrl = await uploadToCloudinary(audioFilePath, 'audio', 'video'); // cloudinary uses 'video' for audio

          console.log(`   [Upload] Cover Art...`);
          let uploadedCoverUrl = "https://picsum.photos/400";
          try {
            const coverPath = path.join(__dirname, 'temp_audio', songData.coverUrl);
            if (fs.existsSync(coverPath)) {
              uploadedCoverUrl = await uploadToCloudinary(coverPath, 'covers', 'image');
            }
          } catch(err) {}

          const audio = new Audio({
            title: songData.title,
            category: 'song',
            genre: songData.genre,
            singer: artistData.name,
            duration: songData.duration,
            audioUrl: uploadedAudioUrl,
            coverImageUrl: uploadedCoverUrl,
            uploadedBy: user._id,
            isPrivate: false,
            status: 'approved',
            listenTimes: Math.floor(Math.random() * 5000000),
            totalListenSeconds: Math.floor(Math.random() * 100000000)
          });
          
          const savedAudio = await audio.save();
          songIds.push(savedAudio._id);
          console.log(`   ✅ Saved Song: ${songData.title}`);
        } else {
          songIds.push(existingSong._id);
          console.log(`   ⚠️ Song already exists: ${songData.title}`);
        }
      }

      // 4. Create Playlist (Album)
      if (songIds.length > 0) {
        let existingPlaylist = await Playlist.findOne({ name: artistData.albumName, owner: user._id });
        if (!existingPlaylist) {
          
          let albumCoverUrl = "https://picsum.photos/400";
          try {
            const coverPath = path.join(__dirname, 'temp_audio', artistData.albumCover);
            if (fs.existsSync(coverPath)) {
              albumCoverUrl = await uploadToCloudinary(coverPath, 'covers', 'image');
            }
          } catch(err) {}

          const album = new Playlist({
            name: artistData.albumName,
            owner: user._id,
            cover: albumCoverUrl,
            audio: songIds,
            description: `The official album ${artistData.albumName} by ${artistData.name}`,
            isPublic: true
          });
          await album.save();
          console.log(`   💿 Created Album (Playlist): ${artistData.albumName} with ${songIds.length} tracks.`);
        } else {
          console.log(`   💿 Album (Playlist) already exists: ${artistData.albumName}`);
        }
      }

    }

    console.log('\n🎉 Real Data Seeding Completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
