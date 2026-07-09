const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cover: {
    type: String,
    default: "No Cover",
  },

  audio: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Audio",
      },
    ],
    required: true,
    default: [],
  },
  description: {
    type: String,
    default: "No Description",
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isAlbum: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // Normal playlists are auto-approved, albums go to pending
  }
},
{ timestamps:true });

const PlaylistModel = mongoose.model("Playlist", PlaylistSchema);

module.exports = PlaylistModel;
