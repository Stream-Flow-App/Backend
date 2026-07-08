const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.Controller');
const { checkAuthenticated, authorizeRoles } = require('../middlewares/auth.Middleware');

// === Moderation Routes ===
// These routes are accessible to both 'admin' and 'moderator'
router.get('/moderation/audios/pending', checkAuthenticated, authorizeRoles('admin', 'moderator'), moderationController.getPendingAudios);
router.put('/moderation/audios/:id/status', checkAuthenticated, authorizeRoles('admin', 'moderator'), moderationController.updateAudioStatus);

module.exports = router;
