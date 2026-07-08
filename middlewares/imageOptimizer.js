const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const processImage = async (file) => {
  if (!file || !file.mimetype.startsWith('image/')) return file;
  
  const originalPath = file.path;
  const directory = path.dirname(originalPath);
  const baseName = path.parse(file.filename).name;
  const webpFilename = `${baseName}.webp`;
  const webpPath = path.join(directory, webpFilename);
  
  await sharp(originalPath)
    .webp({ quality: 80 })
    .toFile(webpPath);
    
  // Delete original
  fs.unlink(originalPath, (err) => {
    if (err) console.error('Failed to delete original image:', err);
  });
  
  file.filename = webpFilename;
  file.path = webpPath;
  file.mimetype = 'image/webp';
  return file;
};

const optimizeImage = async (req, res, next) => {
  try {
    if (req.file) {
      await processImage(req.file);
    } else if (req.files) {
      for (const fieldname in req.files) {
        for (let i = 0; i < req.files[fieldname].length; i++) {
          await processImage(req.files[fieldname][i]);
        }
      }
    }
    next();
  } catch (error) {
    console.error('Image optimization failed:', error);
    next(error);
  }
};

module.exports = { optimizeImage };
