import express from 'express';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload, getFileUrl } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const DEFAULT_PRODUCTS = [
  {
    _id: '60c72b2f9b1d8b2bad000201',
    name: 'UltraTech Super Cement (50kg Bag)',
    category: 'cement',
    brand: 'UltraTech',
    price: 385,
    unit: 'Bag',
    description: 'Engineered OPC 53 Grade high-strength building cement ideal for reinforced concrete structures.',
    specs: { Grade: 'OPC 53', Packaging: '50kg HDPE Bag', Standard: 'IS 12269' },
    images: ['/cement.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000202',
    name: 'Godrej Brass Mortise Door Lock & Handles',
    category: 'hardware',
    brand: 'Godrej',
    price: 2450,
    unit: 'Set',
    description: 'Heavy-duty solid brass mortise door handle and cylinder lock set for main doors.',
    specs: { Material: 'Solid Brass', Finish: 'Antique Antique Gold', Warranty: '5 Years' },
    images: ['/hardware.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000203',
    name: 'Dr. Fixit LW+ Waterproofing Chemical 5L',
    category: 'chemicals',
    brand: 'Pidilite',
    price: 850,
    unit: 'Can',
    description: 'Integral liquid waterproofing compound for concrete and mortar plastification.',
    specs: { Volume: '5 Liters', Dosage: '200ml per bag of cement' },
    images: ['/chemicals.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000204',
    name: 'Jaquar Chrome Brass Pillar Tap',
    category: 'cp-fittings',
    brand: 'Jaquar',
    price: 1850,
    unit: 'Piece',
    description: 'Single-lever brass chrome finished basin pillar tap with foam flow aerator.',
    specs: { Material: 'Brass', 'Chrome Plating': 'High Lustre', Cartridge: '35mm Ceramic' },
    images: ['/cp_fittings.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000205',
    name: 'Jindal Panther TMT Rebars 12mm',
    category: 'tmt-steel',
    brand: 'Jindal Panther',
    price: 64500,
    unit: 'Ton',
    description: 'Fe 550D grade high-ductility earthquake resistant thermo-mechanically treated steel bars.',
    specs: { Grade: 'Fe 550D', Diameter: '12mm', Length: '12 Meters' },
    images: ['/hardware.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000206',
    name: 'Astral CPVC Pro Pipes 1 Inch (3m)',
    category: 'plumbing',
    brand: 'Astral',
    price: 420,
    unit: 'Piece',
    description: 'SDR 11 hot and cold potable water plumbing pipe system resistant to high pressure.',
    specs: { Material: 'CPVC Pro', Diameter: '1 Inch', Length: '3 Meters' },
    images: ['/cp_fittings.jpg'],
    inStock: true,
    availability: true,
    featured: false
  },
  {
    _id: '60c72b2f9b1d8b2bad000207',
    name: 'Havells HRFR Insulated Wire 2.5 sq mm (90m)',
    category: 'electrical',
    brand: 'Havells',
    price: 2950,
    unit: 'Roll',
    description: 'Heat resistant flame retardant 100% electrolytic copper conductor wire for domestic wiring.',
    specs: { Conductor: 'Pure Electrolytic Copper', Gauge: '2.5 sq mm', Length: '90m' },
    images: ['/hardware.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000208',
    name: 'Asian Paints Royale Luxury Emulsion (20L)',
    category: 'paints',
    brand: 'Asian Paints',
    price: 6850,
    unit: 'Bucket',
    description: 'Luxury interior acrylic wall coating with Teflon surface protector providing washable smooth finish.',
    specs: { Volume: '20 Liters', Finish: 'Soft Sheen / Silk', Coverage: '280 sq.ft/L' },
    images: ['/chemicals.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000209',
    name: 'Kajaria Glazed Vitrified Tiles (600x1200mm)',
    category: 'tiles',
    brand: 'Kajaria',
    price: 95,
    unit: 'Sq.Ft',
    description: 'High-definition digital printed polished vitrified floor tiles with ultra-low water absorption.',
    specs: { Size: '600x1200 mm', Finish: 'High Gloss Polish', Thickness: '9mm' },
    images: ['/hardware.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000210',
    name: 'Hindware Ceramic Wall-Hung Toilet Closet',
    category: 'sanitaryware',
    brand: 'Hindware',
    price: 8900,
    unit: 'Piece',
    description: 'Rimless vitreous china wall-hung commode with soft-close seat cover and dual flush capability.',
    specs: { Material: 'Vitreous China', Mounting: 'Wall Mounted', 'Flush Type': 'Dual Rimless' },
    images: ['/cp_fittings.jpg'],
    inStock: true,
    availability: true,
    featured: true
  },
  {
    _id: '60c72b2f9b1d8b2bad000211',
    name: 'Bosch Professional 750W Angle Grinder Kit',
    category: 'tools',
    brand: 'Bosch',
    price: 3450,
    unit: 'Kit',
    description: 'High-performance 750W 100mm disc angle grinder for metal cutting, masonry grinding, and tile shaping.',
    specs: { Power: '750 Watts', 'Disc Diameter': '100 mm', 'No-load Speed': '11,000 RPM' },
    images: ['/hardware.jpg'],
    inStock: true,
    availability: true,
    featured: true
  }
];

import { getStoreKey, saveStoreKey } from '../utils/storeHelper.js';

let memoryProducts = getStoreKey('products', DEFAULT_PRODUCTS);

// @desc    Get all products (supports pagination and array output)
// @route   GET /api/products
router.get('/', async (req, res) => {
  const page = Number(req.query.page) || 0;
  const limit = Number(req.query.limit) || 0;
  const keyword = req.query.keyword ? req.query.keyword.toLowerCase() : '';

  try {
    const products = await Product.find({});
    let prodList = (products && products.length > 0) ? products : memoryProducts;

    if (keyword) {
      prodList = prodList.filter(p => p.name.toLowerCase().includes(keyword) || (p.description && p.description.toLowerCase().includes(keyword)));
    }

    if (page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProducts = prodList.slice(startIndex, endIndex);
      const pages = Math.ceil(prodList.length / limit) || 1;
      return res.json({ products: paginatedProducts, pages, page, count: prodList.length });
    }

    return res.json(prodList);
  } catch (error) {
    console.warn('⚠️ Product GET DB Warning (using fallback):', error.message);
    let prodList = memoryProducts;
    if (keyword) {
      prodList = prodList.filter(p => p.name.toLowerCase().includes(keyword) || (p.description && p.description.toLowerCase().includes(keyword)));
    }
    if (page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProducts = prodList.slice(startIndex, endIndex);
      const pages = Math.ceil(prodList.length / limit) || 1;
      return res.json({ products: paginatedProducts, pages, page, count: prodList.length });
    }
    return res.json(memoryProducts);
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) return res.json(product);
  } catch (error) {}

  const memProd = memoryProducts.find(p => String(p._id) === String(req.params.id));
  if (memProd) return res.json(memProd);
  res.status(404).json({ message: 'Product not found' });
});

// @desc    Create product
// @route   POST /api/products
router.post('/', protect, admin, upload.any(), async (req, res) => {
  const { name, category, brand, price, unit, description, inStock, availability, featured } = req.body;
  
  let uploadedImages = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    uploadedImages = req.files.map(f => getFileUrl(f)).filter(Boolean);
  } else if (req.file) {
    const url = getFileUrl(req.file);
    if (url) uploadedImages = [url];
  }
  if (uploadedImages.length === 0) {
    uploadedImages = ['/cement.jpg'];
  }

  const newProdData = {
    _id: '60c72b2f9b1d8b2bad' + Date.now().toString().slice(-6),
    name: name || 'New Building Material Product',
    category: category || 'general',
    brand: brand || 'General Brand',
    price: Number(price || 0),
    unit: unit || 'Unit',
    description: description || '',
    images: uploadedImages,
    image: uploadedImages[0],
    inStock: inStock === 'true' || inStock === true || availability === 'true' || availability === true,
    availability: availability === 'true' || availability === true || inStock === 'true' || inStock === true,
    featured: featured === 'true' || featured === true
  };

  try {
    const product = new Product(newProdData);
    const created = await product.save();
    memoryProducts.unshift(created);
    saveStoreKey('products', memoryProducts);
    return res.status(201).json(created);
  } catch (error) {
    memoryProducts.unshift(newProdData);
    saveStoreKey('products', memoryProducts);
    return res.status(201).json(newProdData);
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
router.put('/:id', protect, admin, upload.any(), async (req, res) => {
  const { name, category, brand, price, unit, description, inStock, availability, featured, existingImages } = req.body;
  
  let uploadedImages = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    uploadedImages = req.files.map(f => getFileUrl(f)).filter(Boolean);
  } else if (req.file) {
    const url = getFileUrl(req.file);
    if (url) uploadedImages = [url];
  }

  let baseImages = [];
  if (existingImages) {
    try {
      baseImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
    } catch (e) {
      baseImages = Array.isArray(existingImages) ? existingImages : [existingImages];
    }
  }

  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      if (name) product.name = name;
      if (category) product.category = category;
      if (brand) product.brand = brand;
      if (price !== undefined) product.price = Number(price);
      if (unit !== undefined) product.unit = unit;
      if (description !== undefined) product.description = description;

      if (uploadedImages.length > 0 || baseImages.length > 0) {
        const finalImages = [...baseImages, ...uploadedImages];
        if (finalImages.length > 0) {
          product.images = finalImages;
          product.image = finalImages[0];
        }
      }

      if (inStock !== undefined || availability !== undefined) {
        const isAvail = availability === 'true' || availability === true || inStock === 'true' || inStock === true;
        product.inStock = isAvail;
        product.availability = isAvail;
      }
      if (featured !== undefined) product.featured = featured === 'true' || featured === true;

      const updated = await product.save();
      const memIdx = memoryProducts.findIndex(p => String(p._id) === String(req.params.id));
      if (memIdx !== -1) memoryProducts[memIdx] = updated;
      saveStoreKey('products', memoryProducts);
      return res.json(updated);
    }
  } catch (error) {}

  const memProd = memoryProducts.find(p => String(p._id) === String(req.params.id));
  if (memProd) {
    if (name) memProd.name = name;
    if (category) memProd.category = category;
    if (brand) memProd.brand = brand;
    if (price !== undefined) memProd.price = Number(price);
    if (unit !== undefined) memProd.unit = unit;
    if (description !== undefined) memProd.description = description;

    if (uploadedImages.length > 0 || baseImages.length > 0) {
      const finalImages = [...baseImages, ...uploadedImages];
      if (finalImages.length > 0) {
        memProd.images = finalImages;
        memProd.image = finalImages[0];
      }
    }
    saveStoreKey('products', memoryProducts);
    return res.json(memProd);
  }

  res.status(404).json({ message: 'Product not found' });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Product.deleteOne({ _id: req.params.id });
  } catch (error) {}
  memoryProducts = memoryProducts.filter(p => String(p._id) !== String(req.params.id));
  saveStoreKey('products', memoryProducts);
  res.json({ message: 'Product deleted successfully' });
});

export { router };
export default router;
