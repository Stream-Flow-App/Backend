const User = require("../models/user.Model");
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.getUser = async function (req, res) {
  try {
    const username = req.params.username;
    if (!username) {
      return res.status(400).json({ message: "username is required!" });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json({
      user,
      isOwner: req.user.username === username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getPublicUser = async function (req, res) {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ message: "username is required!" });

    const user = await User.findOne({ username }).select('name username profileImg isActive').lean();
    if (!user || !user.isActive) return res.status(404).json({ message: "User not found!" });

    const Audio = require('../models/audio.Model');
    const audios = await Audio.find({ uploadedBy: user._id, status: 'approved', isPrivate: false })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name username profileImg');

    res.status(200).json({ user, audios });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.showProfile = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated!' });
    }

    // Populate lastPlayback.songId so frontend can resume
    const user = await User.findById(req.user._id).populate({
      path: 'lastPlayback.songId',
      select: 'title singer audioUrl coverImageUrl genre category duration uploadedBy',
      populate: {
        path: 'uploadedBy',
        model: 'User',
        select: 'username profileImg'
      }
    });

    const safeProfileImg = 
      req.user.profileImg && req.user.profileImg !== 'No Profile Picture'
      ? req.user.profileImg
      : '/assets/images/default-profile.jpg';

    // Transform lastPlayback song to match frontend expected format
    // Also normalize any absolute filesystem paths to web-relative paths
    const normalizeFilePath = (fp) => {
      if (!fp) return fp;
      if (fp.startsWith('/uploads/') || fp.startsWith('/assets/')) return fp;
      const idx = fp.indexOf('/uploads/');
      return idx !== -1 ? fp.substring(idx) : fp;
    };

    let lastPlayback = null;
    if (user.lastPlayback?.songId && typeof user.lastPlayback.songId === 'object') {
      const song = user.lastPlayback.songId;
      lastPlayback = {
        currentTime: user.lastPlayback.currentTime || 0,
        songId: {
          _id: song._id,
          id: song._id,
          title: song.title,
          singer: song.singer,
          artist: song.singer, // alias for normalizeSong
          audioUrl: normalizeFilePath(song.audioUrl),
          coverImageUrl: normalizeFilePath(song.coverImageUrl),
          genre: song.genre,
          category: song.category,
          duration: song.duration,
          uploadedBy: song.uploadedBy,
        }
      };
    }

    res.status(200).json({
      message: 'User profile fetched successfully.',
      user: {
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        profileImg: safeProfileImg,
        lastPlayback,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while fetching profile.' });
  }
};

exports.editProfile = async function (req, res) {
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('editProfile originalUrl:', req.originalUrl);

  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.body.name && req.body.name.trim()) user.name = req.body.name.trim();
  if (req.body.username && req.body.username.trim()) user.username = req.body.username.trim();
  if (req.body.phone && req.body.phone.trim()) user.phone = req.body.phone.trim();

  if (req.file) {
    try {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'streamflow/profiles', 'image');
      user.profileImg = cloudUrl;
    } catch (err) {
      console.error("Cloudinary upload failed during profile edit:", err);
    }
  }

  await user.save();

  res.status(200).json({
    message: 'Profile updated!',
    user: {
      name: user.name,
      username: user.username,
      phone: user.phone,
      role: user.role,
      profileImg: user.profileImg,
      lastPlayback: user.lastPlayback
    }
  });
};

exports.syncPlayback = async function (req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated!' });
    }

    const { songId, currentTime } = req.body;

    // Use findByIdAndUpdate to avoid pre-save hooks and just update the nested field
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'lastPlayback.songId': songId || null,
        'lastPlayback.currentTime': currentTime || 0
      }
    });

    res.status(200).json({ message: 'Playback state synced' });
  } catch (err) {
    console.error('Error syncing playback:', err);
    res.status(500).json({ message: 'Something went wrong while syncing playback state' });
  }
};