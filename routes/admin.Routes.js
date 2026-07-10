const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.Controller')
const audioController = require('../controllers/audio.Controller');
const albumController = require('../controllers/album.Controller');
const {checkAuthenticated , authorizeRoles} = require('../middlewares/auth.Middleware');

// admin user routes
router.post('/admin/user' , checkAuthenticated, authorizeRoles('admin'), adminController.createUser);
router.get('/admin/users' , checkAuthenticated, authorizeRoles('admin', 'moderator'), adminController.getUsers);
router.get('/admin/users/:username' , checkAuthenticated, authorizeRoles('admin', 'moderator'), adminController.getUser);
router.put('/admin/users/:username' , checkAuthenticated, authorizeRoles('admin'), adminController.updateUser);
router.delete('/admin/users/:username' , checkAuthenticated, authorizeRoles('admin', 'moderator'), adminController.deactivateUser);
router.put('/admin/users/:username/ban', checkAuthenticated, authorizeRoles('admin', 'moderator'), adminController.updateUserBan);
router.put('/admin/users/:username/role', checkAuthenticated, authorizeRoles('admin'), adminController.updateUserRole);

// admin audio routes
router.get('/admin/audios', checkAuthenticated, authorizeRoles('admin', 'moderator'), audioController.getAdminAllAudios);
router.delete('/admin/audios/:id', checkAuthenticated, authorizeRoles('admin', 'moderator'), audioController.adminDeleteAudio);

// admin album routes
router.get('/admin/albums/pending', checkAuthenticated, authorizeRoles('admin', 'moderator'), albumController.getPendingAlbums);
router.patch('/admin/album/:id/approve', checkAuthenticated, authorizeRoles('admin', 'moderator'), albumController.approveAlbum);
router.patch('/admin/album/:id/reject', checkAuthenticated, authorizeRoles('admin', 'moderator'), albumController.rejectAlbum);

module.exports = router;