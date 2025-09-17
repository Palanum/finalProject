const express = require('express');
const router = express.Router();

const { uploadImage, upload, deleteImage } = require('../utils/cloudinary');

//upload to cloundinary
router.post('/cloudinary/upload', upload.single('file'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const result = await uploadImage(buffer, { folder: 'recipes' });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE 
router.delete('/cloudinary/delete', async (req, res) => {
  try {
    const { url } = req.body; // send url of the image to delete
    if (!url) return res.status(400).json({ error: 'No URL provided' });
    await deleteImage(url); // your utility
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
