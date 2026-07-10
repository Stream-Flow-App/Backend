const express = require('express');
const router = express.Router();
const {
  createAlbum,
  getUserAlbums,
  getPublicAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  addSongToAlbum,
  removeSongFromAlbum
} = require('../controllers/album.Controller');
const { checkAuthenticated, checkOptionalAuthenticated } = require('../middlewares/auth.Middleware');

const upload = require('../config/multer');
const { optimizeImage } = require('../middlewares/imageOptimizer');

// Base route: /api/albums

// Get all public albums
router.get('/public', getPublicAlbums);

// Get all albums for the authenticated user
router.get('/me', checkAuthenticated, getUserAlbums);

// Create a new album
router.post('/', checkAuthenticated, upload.single('cover'), optimizeImage, createAlbum);

// Get a specific album by ID
router.get('/:id', checkOptionalAuthenticated, getAlbumById);

// Update a specific album
router.put('/:id', checkAuthenticated, upload.single('cover'), optimizeImage, updateAlbum);

// Delete a specific album
router.delete('/:id', checkAuthenticated, deleteAlbum);

// Add a song to an album
router.post('/:id/songs', checkAuthenticated, addSongToAlbum);

// Remove a song from an album
router.delete('/:id/songs/:songId', checkAuthenticated, removeSongFromAlbum);

module.exports = router;
