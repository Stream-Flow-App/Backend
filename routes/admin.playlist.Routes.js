const express = require("express");
const router = express.Router();

const { checkAuthenticated, authorizeRoles } = require("../middlewares/auth.Middleware");
const { getPendingAlbums, approveAlbum, rejectAlbum } = require("../controllers/album.Controller");
const validateObjectId = require("../middlewares/validateObjectId");

// === Admin: Get Pending Albums ===
router.get("/admin/albums/pending", checkAuthenticated, authorizeRoles("admin", "moderator"), getPendingAlbums);

// === Admin: Approve Album ===
router.patch("/admin/album/:id/approve", checkAuthenticated, authorizeRoles("admin", "moderator"), validateObjectId, approveAlbum);

// === Admin: Reject Album ===
router.patch("/admin/album/:id/reject", checkAuthenticated, authorizeRoles("admin", "moderator"), validateObjectId, rejectAlbum);

module.exports = router;
