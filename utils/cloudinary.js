const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file to Cloudinary and removes the local file upon success.
 * @param {String} localFilePath - Path to the local file
 * @param {String} folder - Cloudinary folder name (e.g. "streamflow/profiles")
 * @param {String} resourceType - Resource type ('image', 'video', 'raw', 'auto')
 * @returns {Promise<String>} The secure URL of the uploaded file
 */
const uploadToCloudinary = async (localFilePath, folder, resourceType = 'auto') => {
  try {
    if (!localFilePath) return null;
    
    // Upload to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: resourceType,
    });
    
    // Delete local file after successful upload
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.error(`Failed to delete local file ${localFilePath} after upload:`, err);
    }
    
    return response.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // DO NOT delete the local file if upload fails, to allow local fallback to work
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
