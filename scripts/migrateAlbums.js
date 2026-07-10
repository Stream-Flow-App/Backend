const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PlaylistModel = require('../models/playlist.Model');
const AlbumModel = require('../models/album.Model');

dotenv.config();

const migrateAlbums = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all playlists that are marked as albums
    const albumsToMigrate = await PlaylistModel.find({ isAlbum: true });
    
    if (albumsToMigrate.length === 0) {
      console.log('No albums found to migrate.');
      process.exit(0);
    }
    
    console.log(`Found ${albumsToMigrate.length} albums to migrate.`);
    
    let successCount = 0;
    
    for (const playlist of albumsToMigrate) {
      try {
        // Check if it already exists in the Album collection
        const existing = await AlbumModel.findById(playlist._id);
        
        if (!existing) {
          const newAlbum = new AlbumModel({
            _id: playlist._id, // Preserve the same ID!
            name: playlist.name,
            owner: playlist.owner,
            cover: playlist.cover,
            audio: playlist.audio,
            description: playlist.description,
            isPublic: playlist.isPublic,
            status: playlist.status,
            createdAt: playlist.createdAt,
            updatedAt: playlist.updatedAt
          });
          
          await newAlbum.save();
          console.log(`Migrated album: ${playlist.name}`);
        } else {
          console.log(`Album ${playlist.name} already exists in Albums collection.`);
        }
        
        // Remove from playlists collection
        await PlaylistModel.findByIdAndDelete(playlist._id);
        console.log(`Deleted ${playlist.name} from Playlists collection.`);
        
        successCount++;
      } catch (err) {
        console.error(`Failed to migrate album ${playlist.name}:`, err);
      }
    }
    
    console.log(`Migration complete. Successfully migrated ${successCount}/${albumsToMigrate.length} albums.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateAlbums();
