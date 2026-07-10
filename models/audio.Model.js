const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['song', 'podcast', 'audiobook'],
    default: 'song'
  },
  duration: {
    type: Number,
    required: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  audioUrl: {
    type: String,
    required: true
  },
  coverImageUrl: {
    type: String,
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  singer: {
    type: String,
    required: true,
    validate: {
      validator: function(string) {
        return string.length > 0;
      },
      message: 'At least one singer is required.'
    }
  },
  duration: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  listenTimes: {
    type: Number,
    default: 0
  },
  totalListenSeconds: {
    type: Number,
    default: 0
  }
});
// Add indexing for faster queries
audioSchema.index({ status: 1, isPrivate: 1 });
audioSchema.index({ title: 'text', singer: 'text', genre: 'text' });

const Audio = mongoose.model("Audio", audioSchema);

module.exports = Audio;