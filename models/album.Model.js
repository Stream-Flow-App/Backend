const mongoose = require("mongoose");

const AlbumSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  }
},
{ timestamps:true });

const AlbumModel = mongoose.model("Album", AlbumSchema);

module.exports = AlbumModel;
