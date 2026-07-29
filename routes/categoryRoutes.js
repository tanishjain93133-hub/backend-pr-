import express from 'express';
import Category from '../models/Category.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload, getFileUrl } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { _id: '60c72b2f9b1d8b2bad000001', name: 'Cement', slug: 'cement', description: 'OPC, PPC, and specialized cement formulations for long-lasting structural strength.', image: '/cement.jpg', icon: 'Building2', order: 1, hide: false },
  { _id: '60c72b2f9b1d8b2bad000002', name: 'Hardware', slug: 'hardware', description: 'Premium door locks, heavy-duty hinges, screws, and structural fasteners.', image: '/hardware.jpg', icon: 'Wrench', order: 2, hide: false },
  { _id: '60c72b2f9b1d8b2bad000003', name: 'Construction Chemicals', slug: 'chemicals', description: 'High-tech waterproofing solutions, sealants, tile adhesives, and grouts.', image: '/chemicals.jpg', icon: 'FlaskConical', order: 3, hide: false },
  { _id: '60c72b2f9b1d8b2bad000004', name: 'CP Fittings', slug: 'cp-fittings', description: 'Designer bathroom faucets, shower mixers, kitchen taps, and sanitaryware.', image: '/cp_fittings.jpg', icon: 'Bath', order: 4, hide: false },
  { _id: '60c72b2f9b1d8b2bad000005', name: 'TMT Steel', slug: 'tmt-steel', description: 'Reinforced concrete thermo-mechanically treated rebars and structural iron rods.', image: '/hardware.jpg', icon: 'Shield', order: 5, hide: false },
  { _id: '60c72b2f9b1d8b2bad000006', name: 'Plumbing Materials', slug: 'plumbing', description: 'Heavy-duty PVC, CPVC, and SWR pipes, fittings, and flow control valves.', image: '/cp_fittings.jpg', icon: 'Pipette', order: 6, hide: false },
  { _id: '60c72b2f9b1d8b2bad000007', name: 'Electrical Materials', slug: 'electrical', description: 'Industrial insulated wires, conduits, distribution boards, and modular switches.', image: '/hardware.jpg', icon: 'Zap', order: 7, hide: false },
  { _id: '60c72b2f9b1d8b2bad000008', name: 'Paints', slug: 'paints', description: 'Luxury acrylic wall coatings, emulsions, primers, and exterior protection coatings.', image: '/chemicals.jpg', icon: 'Paintbrush', order: 8, hide: false },
  { _id: '60c72b2f9b1d8b2bad000009', name: 'Tiles', slug: 'tiles', description: 'Glazed vitrified tiles, ceramic flooring, bathroom walls, and outdoor pavers.', image: '/hardware.jpg', icon: 'Grid', order: 9, hide: false },
  { _id: '60c72b2f9b1d8b2bad000010', name: 'Sanitaryware', slug: 'sanitaryware', description: 'Premium ceramic washbowls, wall-hung closets, and washroom cabinets.', image: '/cp_fittings.jpg', icon: 'Bath', order: 10, hide: false },
  { _id: '60c72b2f9b1d8b2bad000011', name: 'Tools & Accessories', slug: 'tools', description: 'Professional power tools, hand tools, measuring tapes, and on-site safety gear.', image: '/hardware.jpg', icon: 'Hammer', order: 11, hide: false }
];

import { getStoreKey, saveStoreKey } from '../utils/storeHelper.js';

let memoryCategories = getStoreKey('categories', DEFAULT_CATEGORIES);

// @desc    Get all categories (sorted by order field)
// @route   GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ order: 1, name: 1 });
    if (categories && categories.length > 0) {
      return res.json(categories);
    }
    return res.json(memoryCategories);
  } catch (error) {
    console.warn('⚠️ Category GET DB Warning (using fallback):', error.message);
    res.json(memoryCategories);
  }
});

// @desc    Reorder categories
// @route   POST /api/categories/reorder
router.post('/reorder', protect, admin, async (req, res) => {
  const { orders } = req.body;
  try {
    if (orders && Array.isArray(orders)) {
      for (const item of orders) {
        try { await Category.findByIdAndUpdate(item.id, { order: item.order }); } catch (e) {}
        const memItem = memoryCategories.find(c => String(c._id) === String(item.id));
        if (memItem) memItem.order = item.order;
      }
      saveStoreKey('categories', memoryCategories);
    }
    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    res.json({ message: 'Categories reordered successfully' });
  }
});

// @desc    Get single category by slug
// @route   GET /api/categories/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  const reqSlug = req.params.slug.toLowerCase();
  try {
    const category = await Category.findOne({ slug: reqSlug });
    if (category) return res.json(category);
  } catch (error) {}

  const memCategory = memoryCategories.find(c => c.slug === reqSlug || c.slug.replace(/[^a-z0-9]+/g, '-') === reqSlug);
  if (memCategory) return res.json(memCategory);
  res.status(404).json({ message: 'Category not found' });
});

// @desc    Create new category
// @route   POST /api/categories
router.post('/', protect, admin, upload.single('imageFile'), async (req, res) => {
  const { name, slug, description, image, icon, order, hide } = req.body;
  let imagePath = image || '/cement.jpg';
  if (req.file) {
    imagePath = getFileUrl(req.file) || imagePath;
  }

  const slugLower = (slug || name || 'new-category').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const newCat = {
    _id: '60c72b2f9b1d8b2bad' + Date.now().toString().slice(-6),
    name: name || 'New Category',
    slug: slugLower,
    description: description || '',
    image: imagePath,
    icon: icon || 'Building2',
    order: Number(order || memoryCategories.length + 1),
    hide: hide === 'true' || hide === true
  };

  try {
    const category = new Category(newCat);
    const created = await category.save();
    memoryCategories.push(created);
    saveStoreKey('categories', memoryCategories);
    return res.status(201).json(created);
  } catch (error) {
    memoryCategories.push(newCat);
    saveStoreKey('categories', memoryCategories);
    res.status(201).json(newCat);
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
router.put('/:id', protect, admin, upload.single('imageFile'), async (req, res) => {
  const { name, slug, description, image, icon, order, hide } = req.body;
  const uploadedUrl = req.file ? getFileUrl(req.file) : null;
  try {
    const category = await Category.findById(req.params.id);
    if (category) {
      category.name = name || category.name;
      if (slug) category.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      category.description = description !== undefined ? description : category.description;
      if (uploadedUrl) category.image = uploadedUrl;
      else if (image !== undefined) category.image = image;
      if (icon !== undefined) category.icon = icon;
      if (order !== undefined) category.order = Number(order);
      if (hide !== undefined) category.hide = hide === 'true' || hide === true;

      const updated = await category.save();
      const memIndex = memoryCategories.findIndex(c => String(c._id) === String(req.params.id));
      if (memIndex !== -1) memoryCategories[memIndex] = updated;
      saveStoreKey('categories', memoryCategories);
      return res.json(updated);
    }
  } catch (error) {}

  const index = memoryCategories.findIndex(c => String(c._id) === String(req.params.id));
  if (index !== -1) {
    if (name) memoryCategories[index].name = name;
    if (slug) memoryCategories[index].slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (description !== undefined) memoryCategories[index].description = description;
    if (uploadedUrl) memoryCategories[index].image = uploadedUrl;
    else if (image !== undefined) memoryCategories[index].image = image;
    if (icon !== undefined) memoryCategories[index].icon = icon;
    if (order !== undefined) memoryCategories[index].order = Number(order);
    if (hide !== undefined) memoryCategories[index].hide = hide === 'true' || hide === true;
    saveStoreKey('categories', memoryCategories);
    return res.json(memoryCategories[index]);
  }

  res.status(404).json({ message: 'Category not found' });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Category.deleteOne({ _id: req.params.id });
  } catch (error) {}
  memoryCategories = memoryCategories.filter(c => String(c._id) !== String(req.params.id));
  saveStoreKey('categories', memoryCategories);
  res.json({ message: 'Category removed successfully' });
});

export { router };
export default router;
