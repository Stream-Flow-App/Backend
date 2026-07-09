const ArtistApplication = require('../models/artistApplication.Model');
const Notification = require('../models/notification.Model');
const User = require('../models/user.Model');

// === Apply for Artist Role ===
exports.applyForArtist = async (req, res, next) => {
  try {
    const { bio, socialLinks, portfolioLinks } = req.body;
    
    // Check if an application already exists
    const existingApp = await ArtistApplication.findOne({ user: req.user._id });
    if (existingApp && existingApp.status === 'pending') {
      return res.status(400).json({ message: 'You already have a pending application.' });
    }
    
    // If they already have an approved application, or are already an artist
    if (req.user.role === 'artist' || req.user.role === 'admin') {
      return res.status(400).json({ message: 'You are already an artist or admin.' });
    }

    let application = existingApp;
    if (application) {
      // Re-apply if rejected previously
      application.bio = bio;
      application.socialLinks = socialLinks;
      application.portfolioLinks = portfolioLinks;
      application.status = 'pending';
      application.reviewNotes = null;
    } else {
      application = new ArtistApplication({
        user: req.user._id,
        bio,
        socialLinks,
        portfolioLinks
      });
    }

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully!', application });
  } catch (err) {
    next(err);
  }
};

// === Get User's Own Application ===
exports.getMyApplication = async (req, res, next) => {
  try {
    const application = await ArtistApplication.findOne({ user: req.user._id });
    res.status(200).json({ application });
  } catch (err) {
    next(err);
  }
};

// === Admin: Get All Pending Applications ===
exports.getPendingApplications = async (req, res, next) => {
  try {
    const applications = await ArtistApplication.find({ status: 'pending' })
      .populate('user', 'name username email profileImg')
      .sort({ createdAt: -1 });
    res.status(200).json({ count: applications.length, applications });
  } catch (err) {
    next(err);
  }
};

// === Admin: Review Application ===
exports.reviewApplication = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body; // 'approved' or 'rejected'
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    const application = await ArtistApplication.findById(id).populate('user');
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewNotes = reviewNotes || '';
    await application.save();

    // If approved, update user role
    if (status === 'approved') {
      await User.findByIdAndUpdate(application.user._id, { role: 'artist' });
      
      // Create success notification
      await Notification.create({
        user: application.user._id,
        title: 'Artist Application Approved!',
        message: 'Congratulations! Your application to become an artist has been approved. You can now access your Artist Dashboard and start uploading music.',
        type: 'success'
      });
    } else {
      // Create rejection notification
      await Notification.create({
        user: application.user._id,
        title: 'Artist Application Update',
        message: `Your application has been reviewed. Unfortunately, it was not approved at this time. Notes: ${reviewNotes || 'N/A'}`,
        type: 'warning'
      });
    }

    res.status(200).json({ message: `Application ${status} successfully.`, application });
  } catch (err) {
    next(err);
  }
};
