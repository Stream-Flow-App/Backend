const Audio = require('../models/audio.Model');

/**
 * Get all pending audios
 * Roles: Admin, Moderator
 */
exports.getPendingAudios = async (req, res) => {
  try {
    // If user is a moderator, we want to exclude audios uploaded by admins
    let query = { status: 'pending' };
    
    // We need to fetch the pending audios first, then filter out admin uploads
    // since 'uploadedBy' is a reference and we can't easily query its populated fields directly in Mongoose without an aggregate or complex query.
    // However, it's easier to just fetch and filter:
    const audios = await Audio.find(query)
      .populate('uploadedBy', 'name username email profileImg role')
      .sort({ createdAt: -1 });

    const filteredAudios = req.user.role === 'moderator' 
      ? audios.filter(audio => audio.uploadedBy?.role !== 'admin')
      : audios;
    
    res.status(200).json({
      success: true,
      count: filteredAudios.length,
      audios: filteredAudios
    });
  } catch (error) {
    console.error("Error fetching pending audios:", error);
    res.status(500).json({ message: "Server error fetching pending audios." });
  }
};

/**
 * Update audio status (approve/reject)
 * Roles: Admin, Moderator
 */
exports.updateAudioStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ message: "Audio not found." });
    }

    audio.status = status;
    await audio.save();

    res.status(200).json({
      success: true,
      message: `Audio has been ${status}.`,
      audio
    });
  } catch (error) {
    console.error("Error updating audio status:", error);
    res.status(500).json({ message: "Server error updating audio status." });
  }
};
