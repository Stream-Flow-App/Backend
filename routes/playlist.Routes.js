const express = require('express');
const router = express.Router();
const {
  createPlaylist,
  getUserPlaylists,
  getPublicPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  clonePlaylist
} = require('../controllers/playlist.Controller');
const { checkAuthenticated, checkOptionalAuthenticated } = require('../middlewares/auth.Middleware');

// Base route: /api/playlists

// Get all public playlists
router.get('/public', getPublicPlaylists);

// Get all playlists for the authenticated user
router.get('/me', checkAuthenticated, getUserPlaylists);

// Create a new playlist
router.post('/', checkAuthenticated, createPlaylist);

// Get a specific playlist by ID
router.get('/:id', checkOptionalAuthenticated, getPlaylistById);

// Update a specific playlist
router.put('/:id', checkAuthenticated, updatePlaylist);

// Clone a specific playlist
router.post('/clone/:id', checkAuthenticated, clonePlaylist);

// Delete a specific playlist
router.delete('/:id', checkAuthenticated, deletePlaylist);

// Add a song to a playlist
router.post('/:id/songs', checkAuthenticated, addSongToPlaylist);

// Remove a song from a playlist
router.delete('/:id/songs/:songId', checkAuthenticated, removeSongFromPlaylist);

module.exports = router;
