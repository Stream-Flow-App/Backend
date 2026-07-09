const mongoose = require('mongoose');

const artistApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    minlength: 20
  },
  socialLinks: {
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  portfolioLinks: {
    soundcloud: { type: String, trim: true },
    youtube: { type: String, trim: true },
    spotify: { type: String, trim: true }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String
  }
}, { timestamps: true });

const ArtistApplication = mongoose.model('ArtistApplication', artistApplicationSchema);
module.exports = ArtistApplication;
