const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const streamifier = require('streamifier');

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
    // Example: https://res.cloudinary.com/dvly3qlun/image/upload/v1758602733/image_project/recipe_27/jnhpfclp4eyznaabj1b9.jpg
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return null;
    // everything after 'upload/' except the version (v1758602733)
    const pathParts = parts.slice(uploadIndex + 2);
    const publicIdWithExtension = pathParts.join('/');
    return publicIdWithExtension.replace(/\.[^/.]+$/, ''); // remove extension
}


async function deleteImage(url) {
    if (!url) return;
    console.log('url:', url)
    const publicId = getPublicIdFromUrl(url);
    console.log('publicId:', publicId)
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
    }
}

module.exports = { deleteImage, upload, uploadImage };