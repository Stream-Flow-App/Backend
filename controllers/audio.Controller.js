  const path = require('path');
  const fs = require('fs');
  const Audio = require('../models/audio.Model');
  const { uploadToCloudinary } = require('../utils/cloudinary');

  // === Upload Audio ===
  // === Upload Audio ===
  exports.uploadAudio = async (req, res, next) => {
    try {
      const { title, genre, isPrivate, singer, duration } = req.body;

      // Validate files exist
      if (!req.files?.audio?.length || !req.files?.cover?.length) {
        return res.status(400).json({ message: 'Audio and cover image are required.' });
      }

      if (!title || !genre) {
        return res.status(400).json({ message: 'Title and genre are required.' });
      }

      // ✅ Correct singer parsing
      //rewrite it to turn the array into string has names and splitted by ','
      let singers = '';
      if (Array.isArray(singer)) {
        singers = singer.join(',');
      } else if (typeof singer === 'string') {
        singers = singer;
      }

      if (!singers || singers.length === 0) {
        return res.status(400).json({ message: 'At least one singer is required.' });
      }

      if (!duration || isNaN(duration) || duration <= 0) {
        return res.status(400).json({ message: 'Valid duration is required.' });
      }

      const audioFile = req.files.audio[0];
      const coverFile = req.files.cover[0];

      let cloudAudioUrl = `/uploads/audio/${audioFile.filename}`;
      let cloudCoverUrl = `/uploads/audio/${coverFile.filename}`;

      try {
        cloudAudioUrl = await uploadToCloudinary(audioFile.path, 'streamflow/audio', 'video');
        cloudCoverUrl = await uploadToCloudinary(coverFile.path, 'streamflow/covers', 'image');
      } catch (uploadError) {
        console.error("Cloudinary upload failed during audio creation:", uploadError);
      }

      const audio = new Audio({
        title: title.trim(),
        genre: genre.trim(),
        isPrivate: isPrivate === 'true',
        singer: singers,
        audioUrl: cloudAudioUrl,
        coverImageUrl: cloudCoverUrl,
        uploadedBy: req.user._id,
        duration: duration,
        status: (req.user.role === 'admin' || req.user.role === 'moderator') ? 'approved' : 'pending'
      });

      await audio.save();
      res.status(201).json({ message: 'Audio uploaded successfully.', audio });
    } catch (err) {
      next(err);
    }
  };

  // === Get Public Audios ===
  exports.getPublicAudios = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;

      const query = { isPrivate: false, status: 'approved' };
      
      if (req.query.genre && req.query.genre !== 'all') {
        query.genre = new RegExp(`^${req.query.genre}$`, 'i');
      }
      if (req.query.category && req.query.category !== 'all') {
        query.category = new RegExp(`^${req.query.category}$`, 'i');
      }
      if (req.query.artist && req.query.artist !== 'all') {
        query.singer = new RegExp(`^${req.query.artist}$`, 'i');
      }

      const totalCount = await Audio.countDocuments(query);
      const audios = await Audio.find(query)
        .populate('uploadedBy', 'name username profileImg')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({ 
        count: audios.length, 
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        audios 
      });
    } catch (err) {
      next(err);
    }
  };

  exports.GetAllAudios = async (req,res, next) => {
    try {
      // get all audios
      const audios = await Audio.find({ status: 'approved' });
      res.json({ count: audios.length, audios });
    } catch (err) {
      next(err);
    }
  }

  // === Get My Audios ===
  exports.getMyAudios = async (req, res, next) => {
    try {
      const audios = await Audio.find({ uploadedBy: req.user._id })
        .populate('uploadedBy', 'name username profileImg')
        .sort({ createdAt: -1 });
      res.json({ count: audios.length, audios });
    } catch (err) {
      next(err);
    }
  };

  // === Search Audios & Playlists (Unified) ===
  exports.searchAudios = async (req, res, next) => {
    try {
      const query = req.query.q;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;
      
      if (!query || query.trim() === "") {
        return res.status(200).json({ audios: [], playlists: [] });
      }

      // Safe regex matching
      const regex = new RegExp(query, 'i');
      
      const searchCriteria = {
        $or: [
          { title: { $regex: regex } },
          { singer: { $regex: regex } },
          { genre: { $regex: regex } }
        ],
        status: 'approved',
        isPrivate: false
      };

      if (req.query.genre && req.query.genre !== 'all') {
        searchCriteria.genre = new RegExp(`^${req.query.genre}$`, 'i');
      }
      if (req.query.category && req.query.category !== 'all') {
        searchCriteria.category = new RegExp(`^${req.query.category}$`, 'i');
      }
      if (req.query.artist && req.query.artist !== 'all') {
        searchCriteria.singer = new RegExp(`^${req.query.artist}$`, 'i');
      }

      const totalAudios = await Audio.countDocuments(searchCriteria);
      const audios = await Audio.find(searchCriteria)
        .populate('uploadedBy', 'name username profileImg')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Search Playlists unified
      const Playlist = require('../models/playlist.Model');
      const playlistCriteria = {
        isPublic: true,
        status: 'approved',
        name: { $regex: regex }
      };

      const totalPlaylists = await Playlist.countDocuments(playlistCriteria);
      const playlists = await Playlist.find(playlistCriteria)
        .populate('owner', 'name username profileImg')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Search Users (Artists/Profiles)
      const User = require('../models/user.Model');
      const userCriteria = {
        $or: [
          { name: { $regex: regex } },
          { username: { $regex: regex } }
        ],
        isActive: true,
        role: 'artist'
      };

      const totalUsers = await User.countDocuments(userCriteria);
      const users = await User.find(userCriteria)
        .select('name username profileImg')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Search Albums
      const Album = require('../models/album.Model');
      const albumCriteria = {
        isPublic: true,
        status: 'approved',
        name: { $regex: regex }
      };
      const totalAlbums = await Album.countDocuments(albumCriteria);
      const albums = await Album.find(albumCriteria)
        .populate('owner', 'name username profileImg')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        audios,
        totalAudios,
        playlists,
        totalPlaylists,
        users,
        totalUsers,
        albums,
        totalAlbums,
        currentPage: page,
        totalPages: Math.max(Math.ceil(totalAudios / limit), Math.ceil(totalPlaylists / limit), Math.ceil(totalUsers / limit))
      });
    } catch (error) {
      console.error('Error in searchAudios:', error);
      res.status(500).json({ message: 'Search failed.', error: error.message });
    }
  };

  // === Stream Audio ===
  exports.streamAudio = async (req, res, next) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ message: 'Audio not found.' });

      let relativePath = audio.audioUrl;

      // If the audioUrl is already a Cloudinary/external URL, just redirect the player there!
      if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return res.redirect(relativePath);
      }

      // Backwards compatibility for old records that stored absolute paths
      if (relativePath.includes('/uploads/audio/')) {
        relativePath = '/uploads/audio/' + relativePath.split('/uploads/audio/')[1];
      }

      const filePath = path.join(__dirname, '..', relativePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Audio file missing on server.' });
      }

      const stat = fs.statSync(filePath);
      const range = req.headers.range;

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-'); //"bytes=1000-2000" => 1000 , 200
        const start = parseInt(startStr, 10); // decimal
        const end = endStr ? parseInt(endStr, 10) : stat.size - 1;

        if (start >= stat.size) {
          return res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + stat.size);
        }

        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'audio/mpeg',
        });

        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': 'audio/mpeg',
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      next(err);
    }
  };

  // === Update Audio ===
  exports.updateAudio = async (req, res, next) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ message: 'Audio not found.' });
      if (audio.uploadedBy.toString() !== req.user._id.toString() && !['admin', 'moderator'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden. Not your audio.' });
      }

      const { title, genre, isPrivate, singer } = req.body;
      if (title) audio.title = title.trim();
      if (genre) audio.genre = genre.trim();
      if (isPrivate !== undefined) audio.isPrivate = isPrivate === 'true';
      if (singer) {
        if (Array.isArray(singer)) {
          audio.singer = singer.join(',');
        } else if (typeof singer === 'string') {
          audio.singer = singer;
        }
      }

      if (req.files?.cover?.length) {
        try {
          const cloudCoverUrl = await uploadToCloudinary(req.files.cover[0].path, 'streamflow/covers', 'image');
          audio.coverImageUrl = cloudCoverUrl;
        } catch (uploadError) {
          console.error("Cloudinary upload failed during audio update:", uploadError);
        }
      }

      // If the artist updates the song data, it goes back to pending for moderation
      if (audio.uploadedBy.toString() === req.user._id.toString()) {
        audio.status = 'pending';
      }

      await audio.save();
      res.json({ message: 'Audio updated.', audio });
    } catch (err) {
      next(err);
    }
  };

  // === Delete Audio ===
  exports.deleteAudio = async (req, res, next) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ message: 'Audio not found.' });
      if (audio.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden. Not your audio.' });
      }

      await audio.deleteOne();
      res.json({ message: 'Audio deleted.' });
    } catch (err) {
      next(err);
    }
  };

  // === Admin Delete Audio ===
  exports.adminDeleteAudio = async (req, res, next) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ message: 'Audio not found.' });

      await audio.deleteOne();
      res.json({ message: 'Audio deleted by admin.' });
    } catch (err) {
      next(err);
    }
  };

  // === Admin Get All Audios ===
  exports.getAdminAllAudios = async (req, res, next) => {
    try {
      // Admin should see ALL audios, regardless of status
      const audios = await Audio.find().populate('uploadedBy', 'name email');
      res.json({ count: audios.length, audios });
    } catch (err) {
      next(err);
    }
  };

  // === Admin Get Pending Audios ===
  exports.getPendingAudios = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;

      const audios = await Audio.find({ status: 'pending' })
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      const totalCount = await Audio.countDocuments({ status: 'pending' });

      res.json({
        count: audios.length,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        audios
      });
    } catch (err) {
      next(err);
    }
  };

  // === Admin Approve Audio ===
  exports.approveAudio = async (req, res, next) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ message: 'Audio not found.' });
      
      audio.status = 'approved';
      await audio.save();
      res.json({ message: 'Audio approved successfully.', audio });
    } catch (err) {
      next(err);
    }
  };

  // === Admin Reject Audio ===
  exports.rejectAudio = async (req, res, next) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ message: 'Audio not found.' });
      
      audio.status = 'rejected';
      await audio.save();
      res.json({ message: 'Audio rejected successfully.', audio });
    } catch (err) {
      next(err);
    }
  };

  // === Increment Listen Times and Total Listen Seconds ===
  exports.incrementListenTimes = async (req, res, next) => {
    try {
      const audioId = req.params.id;
      const listenedSeconds = Number(req.body?.listenedSeconds) || 0;
      const isNewPlay = req.body?.isNewPlay !== false;
      
      const incObj = { totalListenSeconds: listenedSeconds };
      if (isNewPlay) {
        incObj.listenTimes = 1;
      }

      const audio = await Audio.findByIdAndUpdate(
        audioId,
        { $inc: incObj },
        { new: true }
      );

      if (!audio) {
        return res.status(404).json({ message: 'Audio not found' });
      }

      res.status(200).json({ 
        message: 'Listen time incremented', 
        listenTimes: audio.listenTimes,
        totalListenSeconds: audio.totalListenSeconds
      });
    } catch (err) {
      next(err);
    }
  };