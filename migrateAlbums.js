const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Playlist = require('./models/playlist.Model');
const User = require('./models/user.Model');

dotenv.config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soundwave';

async function migrateData() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB.\n');

    const artists = await User.find({ role: 'artist' });
    const artistIds = artists.map(a => a._id);

    const result = await Playlist.updateMany(
      { owner: { $in: artistIds } },
      { $set: { isAlbum: true, status: 'approved' } }
    );

    console.log(`✅ Migrated ${result.modifiedCount} artist playlists to be Albums and approved.`);

  } catch (error) {
    console.error('❌ Error migrating data:', error);
  } finally {
    mongoose.connection.close();
  }
}

migrateData();
