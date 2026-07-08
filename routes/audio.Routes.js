const express = require("express");
const router = express.Router();
const path = require('path');
const upload = require("../config/multer");
const { optimizeImage } = require('../middlewares/imageOptimizer');
const { checkAuthenticated } = require("../middlewares/auth.Middleware");
const validateObjectId = require("../middlewares/validateObjectId");

const {
  uploadAudio,
  getPublicAudios,
  getMyAudios,
  streamAudio,
  updateAudio,
  deleteAudio,
  searchAudios
} = require("../controllers/audio.Controller");

// // Upload page (HTML)
// router.get('/upload', checkAuthenticated, (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'public', 'upload-audio.html'));
// });

// ✅ Final upload route — matches your fetch
router.get("/", getPublicAudios);
router.post(
  "/upload", // <-- correct path!
  checkAuthenticated,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  optimizeImage,
  uploadAudio
);

// Other routes
router.get("/search", searchAudios);
router.get("/category/:category", (req, res, next) => {
  req.query.category = req.params.category;
  getPublicAudios(req, res, next);
});
router.get("/category/:category/search", (req, res, next) => {
  req.query.category = req.params.category;
  searchAudios(req, res, next);
});
router.get("/song/", getPublicAudios);
router.get("/mine", checkAuthenticated, getMyAudios);
router.get("/stream/:id", streamAudio);
router.put("/:id", checkAuthenticated, validateObjectId, upload.fields([{ name: "cover", maxCount: 1 }]), optimizeImage, updateAudio);
router.delete("/:id", checkAuthenticated, validateObjectId, deleteAudio);

module.exports = router;