import express from 'express';
import Testimonial from '../models/Testimonial.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload, getFileUrl } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @desc    Get all testimonials
// @route   GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new testimonial
// @route   POST /api/testimonials
router.post('/', protect, admin, upload.single('imageFile'), async (req, res) => {
  const { name, role, text, rating, image, hide } = req.body;
  
  let imagePath = image || '';
  if (req.file) {
    imagePath = getFileUrl(req.file) || imagePath;
  }

  try {
    const testimonial = new Testimonial({
      name,
      role,
      text,
      rating: parseInt(rating) || 5,
      image: imagePath,
      hide: hide === 'true' || hide === true
    });
    const created = await testimonial.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
router.put('/:id', protect, admin, upload.single('imageFile'), async (req, res) => {
  const { name, role, text, rating, image, hide } = req.body;
  const uploadedUrl = req.file ? getFileUrl(req.file) : null;
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (testimonial) {
      testimonial.name = name || testimonial.name;
      testimonial.role = role || testimonial.role;
      testimonial.text = text || testimonial.text;
      testimonial.rating = rating !== undefined ? parseInt(rating) : testimonial.rating;
      testimonial.hide = hide !== undefined ? (hide === 'true' || hide === true) : testimonial.hide;
      
      if (uploadedUrl) {
        testimonial.image = uploadedUrl;
      } else if (image !== undefined) {
        testimonial.image = image;
      }
      
      const updated = await testimonial.save();
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Testimonial not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (testimonial) {
      await Testimonial.deleteOne({ _id: req.params.id });
      res.json({ message: 'Testimonial removed successfully' });
    } else {
      res.status(404).json({ message: 'Testimonial not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export { router };
export default router;
