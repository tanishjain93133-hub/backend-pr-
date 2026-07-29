import express from 'express';
import Brand from '../models/Brand.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload, getFileUrl } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const DEFAULT_BRANDS = [
  { _id: '60c72b2f9b1d8b2bad000301', name: 'UltraTech Cement', slug: 'ultratech', logo: '/cement.jpg', website: 'https://ultratechcement.com', featured: true },
  { _id: '60c72b2f9b1d8b2bad000302', name: 'Jindal Panther TMT', slug: 'jindal-panther', logo: '/hardware.jpg', website: 'https://jindalpanther.com', featured: true },
  { _id: '60c72b2f9b1d8b2bad000303', name: 'Astral Pipes', slug: 'astral', logo: '/cp_fittings.jpg', website: 'https://astralpipes.com', featured: true },
  { _id: '60c72b2f9b1d8b2bad000304', name: 'Pidilite / Dr. Fixit', slug: 'pidilite', logo: '/chemicals.jpg', website: 'https://pidilite.com', featured: true },
  { _id: '60c72b2f9b1d8b2bad000305', name: 'Tata Tiscon', slug: 'tata-tiscon', logo: '/hardware.jpg', website: 'https://tatatiscon.co.in', featured: true }
];

import { getStoreKey, saveStoreKey } from '../utils/storeHelper.js';

let memoryBrands = getStoreKey('brands', DEFAULT_BRANDS);

// @desc    Get all brands
// @route   GET /api/brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({});
    if (brands && brands.length > 0) {
      return res.json(brands);
    }
    return res.json(memoryBrands);
  } catch (error) {
    console.warn('⚠️ Brand GET DB Warning (using fallback):', error.message);
    return res.json(memoryBrands);
  }
});

// @desc    Create brand
// @route   POST /api/brands
router.post('/', protect, admin, upload.single('logoFile'), async (req, res) => {
  const { name, slug, logo, website, featured } = req.body;
  let logoPath = logo || '/cement.jpg';
  if (req.file) logoPath = getFileUrl(req.file) || logoPath;

  const newBrandData = {
    _id: '60c72b2f9b1d8b2bad' + Date.now().toString().slice(-6),
    name: name || 'New Brand',
    slug: (slug || name || 'new-brand').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    logo: logoPath,
    website: website || '',
    featured: featured === 'true' || featured === true
  };

  try {
    const brand = new Brand(newBrandData);
    const created = await brand.save();
    memoryBrands.push(created);
    saveStoreKey('brands', memoryBrands);
    return res.status(201).json(created);
  } catch (error) {
    memoryBrands.push(newBrandData);
    saveStoreKey('brands', memoryBrands);
    return res.status(201).json(newBrandData);
  }
});

// @desc    Update brand
// @route   PUT /api/brands/:id
router.put('/:id', protect, admin, upload.single('logoFile'), async (req, res) => {
  const { name, slug, logo, website, featured } = req.body;
  const uploadedUrl = req.file ? getFileUrl(req.file) : null;
  try {
    const brand = await Brand.findById(req.params.id);
    if (brand) {
      brand.name = name || brand.name;
      if (slug) brand.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (uploadedUrl) brand.logo = uploadedUrl;
      else if (logo !== undefined) brand.logo = logo;
      if (website !== undefined) brand.website = website;
      if (featured !== undefined) brand.featured = featured === 'true' || featured === true;

      const updated = await brand.save();
      const memIdx = memoryBrands.findIndex(b => String(b._id) === String(req.params.id));
      if (memIdx !== -1) memoryBrands[memIdx] = updated;
      saveStoreKey('brands', memoryBrands);
      return res.json(updated);
    }
  } catch (error) {}

  const memBrand = memoryBrands.find(b => String(b._id) === String(req.params.id));
  if (memBrand) {
    if (name) memBrand.name = name;
    if (uploadedUrl) memBrand.logo = uploadedUrl;
    else if (logo !== undefined) memBrand.logo = logo;
    if (website !== undefined) memBrand.website = website;
    saveStoreKey('brands', memoryBrands);
    return res.json(memBrand);
  }

  res.status(404).json({ message: 'Brand not found' });
});

// @desc    Delete brand
// @route   DELETE /api/brands/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Brand.deleteOne({ _id: req.params.id });
  } catch (error) {}
  memoryBrands = memoryBrands.filter(b => String(b._id) !== String(req.params.id));
  saveStoreKey('brands', memoryBrands);
  res.json({ message: 'Brand deleted successfully' });
});

export { router };
export default router;
