const AlbumModel = require("../models/album.Model");
const AudioModel = require("../models/audio.Model");
const PlaylistModel = require("../models/playlist.Model");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require('../utils/cloudinary');

// Create a new album
const createAlbum = async (req, res) => {
  try {
    const { name, description, isPublic, coverUrl } = req.body;
    let { audio } = req.body;
    const userId = req.user.id; // From checkAuthenticated middleware

    if (!name) {
      return res.status(400).json({ success: false, message: "Album name is required" });
    }
    
    // Convert audio to array if it's sent as a single string (from FormData)
    if (audio && !Array.isArray(audio)) {
      audio = [audio];
    }
    
    let cover = "No Cover";
    if (req.file) {
      try {
        cover = await uploadToCloudinary(req.file.path, 'streamflow/covers', 'image');
      } catch (uploadError) {
        console.error("Cloudinary upload failed for album cover:", uploadError);
        cover = "/uploads/audio/" + req.file.filename; // Fallback
      }
    } else if (coverUrl) {
      cover = coverUrl;
    }

    const album = await AlbumModel.create({
      name,
      description,
      isPublic: isPublic === 'true' || isPublic === true,
      status: 'pending',
      cover,
      audio: Array.isArray(audio) ? audio : [],
      owner: userId
    });

    res.status(201).json({ success: true, album });
  } catch (error) {
    console.error("Error creating album:", error);
    res.status(500).json({ success: false, message: "Server error creating album" });
  }
};

// Get all albums for the authenticated user
const getUserAlbums = async (req, res) => {
  try {
    const userId = req.user.id;
    const albums = await AlbumModel.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate('audio')
      .populate('owner', 'name email username profileImg');
    console.log("getUserAlbums called for user", userId, "found", albums.length, "albums");
    res.status(200).json({ success: true, albums });
  } catch (error) {
    console.error("Error fetching user albums:", error);
    res.status(500).json({ success: false, message: "Server error fetching albums" });
  }
};

// Get all public albums
const getPublicAlbums = async (req, res) => {
  try {
    const albums = await AlbumModel.find({ isPublic: true, status: 'approved' })
      .populate('audio')
      .populate('owner', 'name username profileImg')
      .sort({ createdAt: -1 });

    const modifiedAlbums = albums.map(pl => {
      const p = pl.toObject();
      if (p.audio && p.audio.length > 0) {
        const lastSong = p.audio[p.audio.length - 1];
        p.cover = lastSong.coverImageUrl || p.cover;
      }
      return p;
    });

    res.status(200).json({ success: true, albums: modifiedAlbums });
  } catch (error) {
    console.error("Error fetching public albums:", error);
    res.status(500).json({ success: false, message: "Server error fetching public albums" });
  }
};

// Get a specific album by ID
const getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid album ID" });
    }

    const album = await AlbumModel.findById(id).populate('audio').populate('owner', 'name username profileImg');

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    // Check if user owns it or if it's public
    if (album.owner._id.toString() !== userId) {
      if (!album.isPublic) {
        return res.status(403).json({ success: false, message: "Not authorized to view this album" });
      }
      if (album.status !== 'approved') {
        return res.status(403).json({ success: false, message: "Album is awaiting approval" });
      }
    }

    res.status(200).json({ success: true, album });
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ success: false, message: "Server error fetching album" });
  }
};

// Update a album
const updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic, audio, coverUrl } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid album ID" });
    }

    const album = await AlbumModel.findById(id);

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    // Admins and moderators can edit any album
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator';
    if (album.owner.toString() !== userId && !isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Not authorized to update this album" });
    }
    
    let audioArray = audio;
    if (audio && !Array.isArray(audio)) {
      audioArray = [audio];
    }
    // Filter out any undefined / non-string / non-ObjectId values
    if (Array.isArray(audioArray)) {
      audioArray = audioArray.filter(id => id && id !== 'undefined' && id.toString() !== 'undefined');
    }

    album.name = name || album.name;
    album.description = description || album.description;
    if (isPublic !== undefined) album.isPublic = isPublic === 'true' || isPublic === true;
    if (audioArray !== undefined && audioArray.length > 0) album.audio = audioArray;
    
    if (req.file) {
      try {
        album.cover = await uploadToCloudinary(req.file.path, 'streamflow/covers', 'image');
      } catch (uploadError) {
        console.error("Cloudinary upload failed for album cover update:", uploadError);
        album.cover = "/uploads/audio/" + req.file.filename; // Fallback
      }
    } else if (coverUrl) {
      album.cover = coverUrl;
    }

    if (!isAdminOrMod) {
      album.status = 'pending';
    }

    await album.save();
    
    // Sync the changes to any saved playlists for this album
    await PlaylistModel.updateMany(
      { originalId: album._id },
      { 
        $set: { 
          name: album.name, 
          description: album.description, 
          cover: album.cover,
          audio: album.audio 
        } 
      }
    );
    
    // Return populated album
    const updatedAlbum = await AlbumModel.findById(id).populate('audio');

    res.status(200).json({ success: true, album: updatedAlbum });
  } catch (error) {
    console.error("Error updating album:", error);
    res.status(500).json({ success: false, message: "Server error updating album" });
  }
};

// Delete a album
const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid album ID" });
    }

    const album = await AlbumModel.findById(id);

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (album.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this album" });
    }

    await AlbumModel.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Album deleted successfully" });
  } catch (error) {
    console.error("Error deleting album:", error);
    res.status(500).json({ success: false, message: "Server error deleting album" });
  }
};

// Add a song to a album
const addSongToAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ success: false, message: "Invalid album or song ID" });
    }

    const album = await AlbumModel.findById(id);

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (album.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this album" });
    }

    // Check if song exists
    const song = await AudioModel.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    // Check if song is already in the album
    if (album.audio.includes(songId)) {
      return res.status(400).json({ success: false, message: "Song is already in the album" });
    }

    album.audio.push(songId);
    
    // Automatically set cover to the first song's cover if no cover is set or if it's the default
    if (album.audio.length === 1 && (!album.cover || album.cover === "No Cover")) {
        album.cover = song.cover;
    }
    
    await album.save();

    const updatedAlbum = await AlbumModel.findById(id).populate('audio');

    res.status(200).json({ success: true, album: updatedAlbum });
  } catch (error) {
    console.error("Error adding song to album:", error);
    res.status(500).json({ success: false, message: "Server error adding song to album" });
  }
};

// Remove a song from a album
const removeSongFromAlbum = async (req, res) => {
  try {
    const { id, songId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ success: false, message: "Invalid album or song ID" });
    }

    const album = await AlbumModel.findById(id);

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (album.owner.toString() !== userId && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this album" });
    }

    // Remove song
    album.audio = album.audio.filter(audioId => audioId.toString() !== songId);
    
    // Check if the removed song was the cover. If so, and there are other songs, update cover
    if (album.audio.length > 0) {
       const newFirstSong = await AudioModel.findById(album.audio[0]);
       if (newFirstSong) {
          album.cover = newFirstSong.coverImageUrl || "No Cover";
       }
    } else {
       album.cover = "No Cover";
    }

    await album.save();

    const updatedAlbum = await AlbumModel.findById(id).populate('audio');

    res.status(200).json({ success: true, album: updatedAlbum });
  } catch (error) {
    console.error("Error removing song from album:", error);
    res.status(500).json({ success: false, message: "Server error removing song from album" });
  }
};

// Clone a album
const cloneAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid album ID" });
    }

    const originalAlbum = await AlbumModel.findById(id);

    if (!originalAlbum) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (!originalAlbum.isPublic && originalAlbum.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to clone this album" });
    }

    const newAlbum = await AlbumModel.create({
      name: originalAlbum.name,
      description: originalAlbum.description,
      isPublic: false,
      isAlbum: false,
      status: 'approved',
      audio: originalAlbum.audio,
      cover: originalAlbum.cover,
      owner: userId,
      originalId: originalAlbum._id
    });

    const populatedAlbum = await AlbumModel.findById(newAlbum._id).populate('audio');

    res.status(201).json({ success: true, album: populatedAlbum });
  } catch (error) {
    console.error("Error cloning album:", error);
    res.status(500).json({ success: false, message: "Server error cloning album" });
  }
};

// === Admin Get Pending Albums ===
const getPendingAlbums = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const albums = await AlbumModel.find({ status: 'pending' })
      .populate('owner', 'name email username profileImg')
      .populate('audio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await AlbumModel.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      count: albums.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      albums
    });
  } catch (error) {
    console.error("Error fetching pending albums:", error);
    res.status(500).json({ success: false, message: "Server error fetching pending albums" });
  }
};

// === Admin Approve Album ===
const approveAlbum = async (req, res) => {
  try {
    const album = await AlbumModel.findById(req.params.id);
    if (!album) return res.status(404).json({ success: false, message: 'Album not found.' });
    
    album.status = 'approved';
    await album.save();
    res.json({ success: true, message: 'Album approved successfully.', album });
  } catch (error) {
    console.error("Error approving album:", error);
    res.status(500).json({ success: false, message: "Server error approving album" });
  }
};

// === Admin Reject Album ===
const rejectAlbum = async (req, res) => {
  try {
    const album = await AlbumModel.findById(req.params.id);
    if (!album) return res.status(404).json({ success: false, message: 'Album not found.' });
    
    album.status = 'rejected';
    await album.save();
    res.json({ success: true, message: 'Album rejected successfully.', album });
  } catch (error) {
    console.error("Error rejecting album:", error);
    res.status(500).json({ success: false, message: "Server error rejecting album" });
  }
};

module.exports = {
  createAlbum,
  getUserAlbums,
  getPublicAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongToAlbum,
  removeSongFromAlbum,
  getPendingAlbums,
  approveAlbum,
  rejectAlbum
};
