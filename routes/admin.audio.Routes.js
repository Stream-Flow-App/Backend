const express = require("express");
const router = express.Router();

const { checkAuthenticated, authorizeRoles } = require("../middlewares/auth.Middleware");
const { 
  getAdminAllAudios, 
  adminDeleteAudio, 
  getPendingAudios, 
  approveAudio, 
  rejectAudio 
} = require("../controllers/audio.Controller");
const validateObjectId = require("../middlewares/validateObjectId");

// === Admin: Get ALL audios ===
router.get("/admin/audios", checkAuthenticated, authorizeRoles("admin", "moderator"), getAdminAllAudios);

// === Admin: Get Pending Audios ===
router.get("/admin/audios/pending", checkAuthenticated, authorizeRoles("admin", "moderator"), getPendingAudios);

// === Admin: Approve Audio ===
router.patch("/admin/audio/:id/approve", checkAuthenticated, authorizeRoles("admin", "moderator"), validateObjectId, approveAudio);

// === Admin: Reject Audio ===
router.patch("/admin/audio/:id/reject", checkAuthenticated, authorizeRoles("admin", "moderator"), validateObjectId, rejectAudio);

// === Admin: Delete any audio ===
router.delete("/admin/audio/:id", checkAuthenticated, authorizeRoles("admin", "moderator"), validateObjectId, adminDeleteAudio);

module.exports = router;
