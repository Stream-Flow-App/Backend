const express = require("express");
const router = express.Router();

const { checkAuthenticated, authorizeRoles } = require("../middlewares/auth.Middleware");
const { getAdminAllAudios, adminDeleteAudio } = require("../controllers/audio.Controller");
const validateObjectId = require("../middlewares/validateObjectId");

// === Admin: Get ALL audios ===
router.get("/admin/audios", checkAuthenticated, authorizeRoles("admin", "moderator"), getAdminAllAudios);

// === Admin: Delete any audio ===
router.delete("/admin/audio/:id", checkAuthenticated, authorizeRoles("admin", "moderator"), validateObjectId, adminDeleteAudio);

module.exports = router;
