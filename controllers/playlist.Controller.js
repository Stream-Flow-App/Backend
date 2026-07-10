const PlaylistModel = require("../models/playlist.Model");
const AudioModel = require("../models/audio.Model");
const mongoose = require("mongoose");

// Create a new playlist
const createPlaylist = async (req, res) => {
  try {
    const { name, description, isPublic, isAlbum, coverUrl } = req.body;
    let { audio } = req.body;
    const userId = req.user.id; // From checkAuthenticated middleware

    if (!name) {
      return res.status(400).json({ success: false, message: "Playlist name is required" });
    }
    
    // Convert audio to array if it's sent as a single string (from FormData)
    if (audio && !Array.isArray(audio)) {
      audio = [audio];
    }
    
    let cover = "No Cover";
    if (req.file) {
      cover = req.file.path.replace(/\\/g, '/');
    } else if (coverUrl) {
      cover = coverUrl;
    }

    const playlist = await PlaylistModel.create({
      name,
      description,
      isPublic: isPublic === 'true' || isPublic === true,
      isAlbum: isAlbum === 'true' || isAlbum === true,
      status: (isAlbum === 'true' || isAlbum === true) ? 'pending' : 'approved',
      cover,
      audio: Array.isArray(audio) ? audio : [],
      owner: userId
    });

    res.status(201).json({ success: true, playlist });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ success: false, message: "Server error creating playlist" });
  }
};

// Get all playlists for the authenticated user
const getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user.id;
    const playlists = await PlaylistModel.find({ owner: userId }).sort({ createdAt: -1 }).populate('audio');
    res.status(200).json({ success: true, playlists });
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    res.status(500).json({ success: false, message: "Server error fetching playlists" });
  }
};

// Get all public playlists
const getPublicPlaylists = async (req, res) => {
  try {
    const playlists = await PlaylistModel.find({ isPublic: true, status: 'approved' })
      .populate('audio')
      .populate('owner', 'name username profileImg')
      .sort({ createdAt: -1 });

    const modifiedPlaylists = playlists.map(pl => {
      const p = pl.toObject();
      if (p.audio && p.audio.length > 0) {
        const lastSong = p.audio[p.audio.length - 1];
        p.cover = lastSong.coverImageUrl || p.cover;
      }
      return p;
    });

    res.status(200).json({ success: true, playlists: modifiedPlaylists });
  } catch (error) {
    console.error("Error fetching public playlists:", error);
    res.status(500).json({ success: false, message: "Server error fetching public playlists" });
  }
};

// Get a specific playlist by ID
const getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID" });
    }

    const playlist = await PlaylistModel.findById(id).populate('audio').populate('owner', 'name username profileImg');

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    // Check if user owns it or if it's public
    if (playlist.owner._id.toString() !== userId) {
      if (!playlist.isPublic) {
        return res.status(403).json({ success: false, message: "Not authorized to view this playlist" });
      }
      if (playlist.status !== 'approved') {
        return res.status(403).json({ success: false, message: "Playlist is awaiting approval" });
      }
    }

    res.status(200).json({ success: true, playlist });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).json({ success: false, message: "Server error fetching playlist" });
  }
};

// Update a playlist
const updatePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic, audio, coverUrl } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID" });
    }

    const playlist = await PlaylistModel.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    // Admins and moderators can edit any playlist
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator';
    if (playlist.owner.toString() !== userId && !isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Not authorized to update this playlist" });
    }
    
    let audioArray = audio;
    if (audio && !Array.isArray(audio)) {
      audioArray = [audio];
    }

    playlist.name = name || playlist.name;
    playlist.description = description || playlist.description;
    if (isPublic !== undefined) playlist.isPublic = isPublic === 'true' || isPublic === true;
    if (audioArray !== undefined) playlist.audio = audioArray;
    
    if (req.file) {
      playlist.cover = req.file.path.replace(/\\/g, '/');
    } else if (coverUrl) {
      playlist.cover = coverUrl;
    }

    // If artist edits an album, revert to pending
    if (playlist.isAlbum && !isAdminOrMod) {
      playlist.status = 'pending';
    }

    await playlist.save();
    
    // Return populated playlist
    const updatedPlaylist = await PlaylistModel.findById(id).populate('audio');

    res.status(200).json({ success: true, playlist: updatedPlaylist });
  } catch (error) {
    console.error("Error updating playlist:", error);
    res.status(500).json({ success: false, message: "Server error updating playlist" });
  }
};

// Delete a playlist
const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID" });
    }

    const playlist = await PlaylistModel.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this playlist" });
    }

    await PlaylistModel.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Playlist deleted successfully" });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ success: false, message: "Server error deleting playlist" });
  }
};

// Add a song to a playlist
const addSongToPlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ success: false, message: "Invalid playlist or song ID" });
    }

    const playlist = await PlaylistModel.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this playlist" });
    }

    // Check if song exists
    const song = await AudioModel.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    // Check if song is already in the playlist
    if (playlist.audio.includes(songId)) {
      return res.status(400).json({ success: false, message: "Song is already in the playlist" });
    }

    playlist.audio.push(songId);
    
    // Automatically set cover to the first song's cover if no cover is set or if it's the default
    if (playlist.audio.length === 1 && (!playlist.cover || playlist.cover === "No Cover")) {
        playlist.cover = song.cover;
    }
    
    await playlist.save();

    const updatedPlaylist = await PlaylistModel.findById(id).populate('audio');

    res.status(200).json({ success: true, playlist: updatedPlaylist });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    res.status(500).json({ success: false, message: "Server error adding song to playlist" });
  }
};

// Remove a song from a playlist
const removeSongFromPlaylist = async (req, res) => {
  try {
    const { id, songId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ success: false, message: "Invalid playlist or song ID" });
    }

    const playlist = await PlaylistModel.findById(id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== userId && !['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this playlist" });
    }

    // Remove song
    playlist.audio = playlist.audio.filter(audioId => audioId.toString() !== songId);
    
    // Check if the removed song was the cover. If so, and there are other songs, update cover
    if (playlist.audio.length > 0) {
       const newFirstSong = await AudioModel.findById(playlist.audio[0]);
       if (newFirstSong) {
          playlist.cover = newFirstSong.coverImageUrl || "No Cover";
       }
    } else {
       playlist.cover = "No Cover";
    }

    await playlist.save();

    const updatedPlaylist = await PlaylistModel.findById(id).populate('audio');

    res.status(200).json({ success: true, playlist: updatedPlaylist });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    res.status(500).json({ success: false, message: "Server error removing song from playlist" });
  }
};

// Clone a playlist
const clonePlaylist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid playlist ID" });
    }

    const originalPlaylist = await PlaylistModel.findById(id);

    if (!originalPlaylist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (!originalPlaylist.isPublic && originalPlaylist.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to clone this playlist" });
    }

    const newPlaylist = await PlaylistModel.create({
      name: originalPlaylist.name,
      description: originalPlaylist.description,
      isPublic: false,
      isAlbum: false,
      status: 'approved',
      audio: originalPlaylist.audio,
      cover: originalPlaylist.cover,
      owner: userId,
      originalId: originalPlaylist._id
    });

    const populatedPlaylist = await PlaylistModel.findById(newPlaylist._id).populate('audio');

    res.status(201).json({ success: true, playlist: populatedPlaylist });
  } catch (error) {
    console.error("Error cloning playlist:", error);
    res.status(500).json({ success: false, message: "Server error cloning playlist" });
  }
};

module.exports = {
  createPlaylist,
  getUserPlaylists,
  getPublicPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  clonePlaylist
};
