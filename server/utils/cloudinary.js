const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Upload image buffer or base64 string to Cloudinary
 * @param {Buffer} buffer - The image buffer
 * @param {Object} options - Cloudinary options, e.g., { folder: 'recipes' }
 */
function uploadImage(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
    });
}

function getPublicIdFromUrl(url) {
    if (!url) return null;
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/sample.jpg
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    // everything after 'upload/' except the version (v1234567890)
    const pathParts = parts.slice(uploadIndex + 2);
    const publicIdWithExtension = pathParts.join('/');
    return publicIdWithExtension.replace(/\.[^/.]+$/, ''); // remove extension
}


async function deleteImage(url) {
    if (!url) return;
    const publicId = getPublicIdFromUrl(url);
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
    }
}

module.exports = { deleteImage, upload, uploadImage };