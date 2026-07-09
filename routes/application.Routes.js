const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.Controller');
const { checkAuthenticated, authorizeRoles } = require('../middlewares/auth.Middleware');

// === User Routes ===
router.post('/apply', checkAuthenticated, applicationController.applyForArtist);
router.get('/mine', checkAuthenticated, applicationController.getMyApplication);

// === Admin Routes ===
router.get('/admin', checkAuthenticated, authorizeRoles('admin', 'moderator'), applicationController.getPendingApplications);
router.patch('/admin/:id/review', checkAuthenticated, authorizeRoles('admin', 'moderator'), applicationController.reviewApplication);

module.exports = router;
