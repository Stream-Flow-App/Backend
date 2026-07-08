require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const { uploadToCloudinary } = require('./utils/cloudinary');
const User = require('./models/user.Model');
const Audio = require('./models/audio.Model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stream_flow';

const resolveLocalPath = (urlPath) => {
  if (!urlPath) return null;
  // urlPath looks like "/uploads/profiles/file.webp"
  // Map it to absolute path
  return path.join(__dirname, urlPath);
};

const migrate = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await User.find({ profileImg: { $exists: true, $ne: 'No Profile Picture' } });
    for (const user of users) {
      if (user.profileImg.startsWith('/uploads/')) {
        const localPath = resolveLocalPath(user.profileImg);
        console.log(`Uploading profile image for user ${user.username} (${localPath})...`);
        try {
          const cloudUrl = await uploadToCloudinary(localPath, 'streamflow/profiles', 'image');
          user.profileImg = cloudUrl;
          await user.save();
          console.log(`Successfully migrated profile image for user ${user.username}.`);
        } catch (err) {
          console.error(`Failed to migrate profile image for user ${user.username}:`, err.message);
        }
      }
    }

    // 2. Migrate Audio Files
    console.log('Migrating Audio...');
    const audios = await Audio.find({});
    for (const audio of audios) {
      // Audio URL
      if (audio.audioUrl && audio.audioUrl.includes('/uploads/')) {
        let localAudioPath = audio.audioUrl;
        if (localAudioPath.startsWith('/uploads/')) {
           localAudioPath = resolveLocalPath(localAudioPath);
        } else if (localAudioPath.includes('/controllers/../')) {
           localAudioPath = path.resolve(__dirname, 'controllers', '..', localAudioPath.split('/controllers/../')[1]);
        }
        
        console.log(`Uploading audio file for song ${audio.title}...`);
        try {
          const cloudAudioUrl = await uploadToCloudinary(localAudioPath, 'streamflow/audio', 'video');
          audio.audioUrl = cloudAudioUrl;
          await audio.save();
          console.log(`Successfully migrated audio file for song ${audio.title}.`);
        } catch (err) {
          console.error(`Failed to migrate audio for song ${audio.title}:`, err.message);
        }
      }

      // Cover Image
      if (audio.coverImageUrl && audio.coverImageUrl.includes('/uploads/')) {
        let localCoverPath = audio.coverImageUrl;
        if (localCoverPath.startsWith('/uploads/')) {
           localCoverPath = resolveLocalPath(localCoverPath);
        } else if (localCoverPath.includes('/controllers/../')) {
           localCoverPath = path.resolve(__dirname, 'controllers', '..', localCoverPath.split('/controllers/../')[1]);
        }

        console.log(`Uploading cover image for song ${audio.title}...`);
        try {
          const cloudCoverUrl = await uploadToCloudinary(localCoverPath, 'streamflow/covers', 'image');
          audio.coverImageUrl = cloudCoverUrl;
          await audio.save();
          console.log(`Successfully migrated cover image for song ${audio.title}.`);
        } catch (err) {
          console.error(`Failed to migrate cover image for song ${audio.title}:`, err.message);
        }
      }
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
