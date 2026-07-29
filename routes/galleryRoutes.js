import express from 'express';
import Gallery from '../models/Gallery.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload, getFileUrl } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @desc    Get all gallery items
// @route   GET /api/gallery
router.get('/', async (req, res) => {
  try {
    const galleryItems = await Gallery.find({}).sort({ createdAt: -1 });
    res.json(galleryItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new gallery item (admin only)
// @route   POST /api/gallery
router.post('/', protect, admin, upload.single('imageFile'), async (req, res) => {
  const { title, category, image, type } = req.body;
  
  let imagePath = image || '';
  let mediaType = type || 'image';

  if (req.file) {
    imagePath = getFileUrl(req.file) || imagePath;
    const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) {
      mediaType = 'video';
    } else {
      mediaType = 'image';
    }
  }

  try {
    if (!title || !category || !imagePath) {
      return res.status(400).json({ message: 'Title, category and media path are required' });
    }

    const item = new Gallery({
      title,
      category,
      image: imagePath,
      type: mediaType
    });

    const createdItem = await item.save();
    res.status(201).json(createdItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete gallery item (admin only)
// @route   DELETE /api/gallery/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (item) {
      await Gallery.deleteOne({ _id: req.params.id });
      res.json({ message: 'Gallery item removed successfully' });
    } else {
      res.status(404).json({ message: 'Gallery item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export { router };
export default router;
