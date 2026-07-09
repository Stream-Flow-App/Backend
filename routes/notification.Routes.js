const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.Controller');
const { checkAuthenticated } = require('../middlewares/auth.Middleware');

router.get('/', checkAuthenticated, notificationController.getMyNotifications);
router.patch('/read-all', checkAuthenticated, notificationController.markAllAsRead);
router.patch('/:id/read', checkAuthenticated, notificationController.markAsRead);

module.exports = router;
