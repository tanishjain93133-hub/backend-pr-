import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';

// Route Imports
import { router as authRoutes } from './routes/authRoutes.js';
import { router as productRoutes } from './routes/productRoutes.js';
import { router as categoryRoutes } from './routes/categoryRoutes.js';
import { router as brandRoutes } from './routes/brandRoutes.js';
import { router as enquiryRoutes } from './routes/enquiryRoutes.js';
import { router as galleryRoutes } from './routes/galleryRoutes.js';
import { router as testimonialRoutes } from './routes/testimonialRoutes.js';
import { router as settingsRoutes } from './routes/settingsRoutes.js';
import { router as adminRoutes } from './routes/adminRoutes.js'; // New admin sub-routes

// Model Imports (for seeding)
import User from './models/User.js';
import Category from './models/Category.js';
import Brand from './models/Brand.js';
import Product from './models/Product.js';
import Testimonial from './models/Testimonial.js';
import Gallery from './models/Gallery.js';
import ContactDetail from './models/ContactDetail.js';
import HomepageContent from './models/HomepageContent.js';
import WebsiteConfig from './models/WebsiteConfig.js';

dotenv.config();

// Connect to Database will be initialized at startup block below

const app = express();

// Detailed Request Logger Middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQUEST] 📥 ${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
  if (req.method === 'POST' && req.originalUrl.includes('/login')) {
    console.log(`[AUTH] 🔑 Login attempt detected for username/email: "${req.body?.username || 'unknown'}"`);
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[RESPONSE] 📤 ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  next();
});

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://backend-pr.vercel.app',
  'https://pr-material-house.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) || 
                      origin.endsWith('.vercel.app') || 
                      origin.endsWith('.netlify.app') || 
                      origin.endsWith('.netlify.live') || 
                      origin.includes('localhost');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const projectRootPath = path.resolve();
const uploadsDir = path.join(projectRootPath, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Unable to create uploads directory (read-only filesystem):', err.message);
}

// Serve sitemap.xml & robots.txt
app.get('/sitemap.xml', (req, res) => {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://prmaterialhouse1.vercel.app/</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/products</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/brands</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/about</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/gallery</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/contact</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/login</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://prmaterialhouse1.vercel.app/register</loc>
    <lastmod>2026-07-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(sitemapXml);
});

app.get('/robots.txt', (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin
Disallow: /api/
Disallow: /api

Sitemap: https://prmaterialhouse1.vercel.app/sitemap.xml`;
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(robotsTxt);
});

// Serve Static Files
app.use('/uploads', express.static(path.join(projectRootPath, 'uploads')));

let isSeedingCompleted = false;

// Database connection safeguard middleware (Fail-safe with fast timeout)
app.use(async (req, res, next) => {
  if (req.path.includes('/health')) {
    return next();
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    if (!isSeedingCompleted && mongoose.connection.readyState === 1) {
      await seedDatabase();
      isSeedingCompleted = true;
    }
  } catch (err) {
    console.warn('⚠️ Database safeguard warning (proceeding with fallback):', err.message);
  }
  next();
});

// Routes Hookup (Dual mount to support both /api/* and /* serverless rewrites)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.use('/api/categories', categoryRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/brands', brandRoutes);
app.use('/brands', brandRoutes);

app.use('/api/enquiries', enquiryRoutes);
app.use('/enquiries', enquiryRoutes);

app.use('/api/gallery', galleryRoutes);
app.use('/gallery', galleryRoutes);

app.use('/api/testimonials', testimonialRoutes);
app.use('/testimonials', testimonialRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Health Check Endpoint
app.get(['/api/health', '/health'], (req, res) => {
  const uri = process.env.MONGODB_URI;
  let uriStatus = 'Not Set (using local fallback)';
  if (uri) {
    uriStatus = uri.replace(/\/\/.*:.*@/, '//***:***@');
  }
  res.json({ 
    status: 'ok',
    databaseConnected: mongoose.connection.readyState === 1,
    connectionState: mongoose.connection.readyState,
    mongodbUri: uriStatus
  });
});

// Serve Static Frontend Build
const frontendDist = path.join(projectRootPath, 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  
  // Rewrite all non-API GET requests to serve index.html (SPA routing support)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error Middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Seed Initial Database Data
async function seedDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    // 1. Seed Admin
    let admin = await User.findOne({ username: 'admin' });
    if (admin) {
      // Rename and reset old admin account to transition
      admin.username = 'Rahuljain12';
      admin.password = 'PRMATERIAL@2805';
      admin.email = 'admin@prmaterial.com';
      await admin.save();
      console.log('🌱 Transitioned old admin account to Rahuljain12');
    } else {
      let rahul = await User.findOne({ username: 'Rahuljain12' });
      if (rahul) {
        rahul.password = 'PRMATERIAL@2805';
        rahul.email = 'admin@prmaterial.com';
        await rahul.save();
        console.log('🌱 Reset/verified password for Rahuljain12 to PRMATERIAL@2805');
      } else {
        await User.create({
          _id: '60c72b2f9b1d8b2bad123456',
          username: 'Rahuljain12',
          email: 'admin@prmaterial.com',
          password: 'PRMATERIAL@2805', // Will be auto-hashed by Mongoose pre-save hook
          role: 'admin'
        });
        console.log('🌱 Seeded default admin user (username: Rahuljain12, password: PRMATERIAL@2805)');
      }
    }

    // 2. Seed Settings
    const contactCount = await ContactDetail.countDocuments({});
    if (contactCount === 0) {
      await ContactDetail.create({
        phone: '+91 99133 77965',
        email: 'prmaterialhouse@gmail.com',
        address: 'Remote Pan, Ahmedabad, Gujarat, India',
        googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117508.83594612808!2d72.50742456428723!3d23.02250495819777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m3!2d72.5713621!3d23.022505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
        whatsappNumber: '919913377965'
      });
      console.log('🌱 Seeded default contact details for PR Material House');
    } else {
      await ContactDetail.updateMany({}, {
        phone: '+91 99133 77965',
        email: 'prmaterialhouse@gmail.com',
        address: 'Remote Pan, Ahmedabad, Gujarat, India',
        googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117508.83594612808!2d72.50742456428723!3d23.02250495819777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m3!2d72.5713621!3d23.022505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
        whatsappNumber: '919913377965'
      });
      console.log('🔄 Force-updated contact details to PR Material House (Ahmedabad)');
    }
    const homeCount = await HomepageContent.countDocuments({});
    if (homeCount === 0) {
      await HomepageContent.create({
        heroTitle: 'Everything You Need to Build Stronger & Better',
        heroSubtitle: 'Premium Cement, Hardware, CP Fittings & Construction Chemicals for Every Project.',
        heroTagline: 'Your Trusted Partner for Quality Building Materials'
      });
      console.log('🌱 Seeded default homepage settings');
    }
    const configCount = await WebsiteConfig.countDocuments({});
    if (configCount === 0) {
      await WebsiteConfig.create({
        websiteName: 'PR Material House',
        seo: {
          title: 'PR Material House | Premium Building Material Supplier',
          metaDescription: 'PR Material House supplies premium quality cement, hardware, CP fittings, construction chemicals, TMT steel, and other building materials.'
        }
      });
      console.log('🌱 Seeded default dynamic Website Configuration');
    }

    // 3. Seed Categories
    const categoryCount = await Category.countDocuments({});
    let seededCategories = {};
    if (categoryCount === 0) {
      const initialCategories = [
        { name: 'Cement', slug: 'cement', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=300&q=80', description: 'OPC, PPC, and specialized cement formulations for long-lasting structural foundations.', order: 1 },
        { name: 'Hardware', slug: 'hardware', image: 'https://images.unsplash.com/photo-1610527003928-47bd53ef3188?auto=format&fit=crop&w=300&q=80', description: 'Premium door locks, heavy-duty hinges, screws, and structural fasteners.', order: 2 },
        { name: 'Construction Chemicals', slug: 'chemicals', image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=300&q=80', description: 'High-tech waterproofing solutions, sealants, tile adhesives, and grouts.', order: 3 },
        { name: 'CP Fittings', slug: 'cp-fittings', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80', description: 'Designer bathroom faucets, shower mixers, kitchen taps, and sanitaryware.', order: 4 },
        { name: 'TMT Steel', slug: 'tmt-steel', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80', description: 'Reinforced concrete thermo-mechanically treated rebars and structural iron rods.', order: 5 },
        { name: 'Plumbing Materials', slug: 'plumbing', image: 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=300&q=80', description: 'Heavy-duty PVC, CPVC, and SWR pipes, fittings, and flow control valves.', order: 6 },
        { name: 'Electrical Materials', slug: 'electrical', image: 'https://images.unsplash.com/photo-1558244661-d248897f7bc4?auto=format&fit=crop&w=300&q=80', description: 'Industrial insulated wires, conduits, distribution boards, and modular switches.', order: 7 },
        { name: 'Paints', slug: 'paints', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80', description: 'Luxury acrylic wall coatings, emulsions, primers, and exterior protection coatings.', order: 8 },
        { name: 'Tiles', slug: 'tiles', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=300&q=80', description: 'Glazed vitrified tiles, ceramic flooring, bathroom walls, and outdoor pavers.', order: 9 },
        { name: 'Sanitaryware', slug: 'sanitaryware', image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=300&q=80', description: 'Premium ceramic washbowls, wall-hung closets, and washroom cabinets.', order: 10 },
        { name: 'Tools & Accessories', slug: 'tools', image: 'https://images.unsplash.com/photo-1530124560676-10551d5572e8?auto=format&fit=crop&w=300&q=80', description: 'Professional power tools, hand tools, measuring tapes, and on-site safety gear.', order: 11 }
      ];

      for (const cat of initialCategories) {
        const doc = await Category.create(cat);
        seededCategories[cat.slug] = doc._id;
      }
      console.log('🌱 Seeded default categories');
    } else {
      const cats = await Category.find({});
      cats.forEach(c => { seededCategories[c.slug] = c._id; });
    }

    // 4. Seed Brands
    const brandCount = await Brand.countDocuments({});
    let seededBrands = {};
    if (brandCount === 0) {
      const initialBrands = [
        { name: 'UltraTech', logo: '/favicon.svg', website: 'https://www.ultratechcement.com' },
        { name: 'ACC', logo: '/favicon.svg', website: 'https://www.acccement.com' },
        { name: 'Ambuja', logo: '/favicon.svg', website: 'https://www.ambujacement.com' },
        { name: 'Hathi', logo: '/favicon.svg', website: 'https://www.hathicement.com' },
        { name: 'JK Cement', logo: '/favicon.svg', website: 'https://www.jkcement.com' },
        { name: 'Shree Cement', logo: '/favicon.svg', website: 'https://www.shreecement.com' },
        { name: 'Dr. Fixit', logo: '/favicon.svg', website: 'https://www.drfixit.co.in' },
        { name: 'Asian Paints SmartCare', logo: '/favicon.svg', website: 'https://www.asianpaints.com' },
        { name: 'Astral', logo: '/favicon.svg', website: 'https://www.astralpipes.com' },
        { name: 'Supreme', logo: '/favicon.svg', website: 'https://www.supremepipes.com' },
        { name: 'Jaquar', logo: '/favicon.svg', website: 'https://www.jaquar.com' },
        { name: 'Cera', logo: '/favicon.svg', website: 'https://www.cera-india.com' },
        { name: 'Hindware', logo: '/favicon.svg', website: 'https://www.hindwarehomes.com' }
      ];

      for (const brand of initialBrands) {
        const doc = await Brand.create(brand);
        seededBrands[brand.name] = doc._id;
      }
      console.log('🌱 Seeded default brand listings');
    } else {
      const brands = await Brand.find({});
      brands.forEach(b => { seededBrands[b.name] = b._id; });
    }

    // 5. Seed Testimonials
    const testCount = await Testimonial.countDocuments({});
    if (testCount === 0) {
      await Testimonial.create([
        { name: 'Rajesh Mehta', role: 'Project Director, Apex Infra', text: 'PR Material House has been our primary concrete and waterproofing supplier for three major residential towers. Their chemical concrete admixtures and cement quality are top-tier. Delivery is always spot on schedule.', rating: 5 },
        { name: 'Ananya Sen', role: 'Principal Architect, Studio Sen', text: 'The range of architectural hardware and CP fittings PR Material House offers is outstanding. Their luxury hardware series completely aligned with our clients minimalist design specifications. Highly recommended.', rating: 5 },
        { name: 'Vikram Malhotra', role: 'Procurement Head, Horizon Group', text: 'B2B ordering with PR Material House has saved us significant operational hassle. Their bulk pricing structures are highly transparent and their support team provided prompt data sheets for all construction chemicals.', rating: 5 }
      ]);
      console.log('🌱 Seeded testimonials feedback for PR Material House');
    }

    // 6. Seed Gallery
    const galleryCount = await Gallery.countDocuments({});
    if (galleryCount === 0) {
      await Gallery.create([
        { title: 'Commercial Plaza - Foundation Pouring', image: '/cement.jpg', category: 'Construction Projects' },
        { title: 'Luxury Villa - Bathroom Faucets installation', image: '/cp_fittings.jpg', category: 'Interior Fitouts' },
        { title: 'Industrial Warehouse - Hardware fitting', image: '/hardware.jpg', category: 'Hardware' },
        { title: 'Basement Waterproofing Injection', image: '/chemicals.jpg', category: 'Waterproofing' }
      ]);
      console.log('🌱 Seeded portfolio gallery');
    }

    // 7. Seed Products
    if (configCount === 0) {
      const productCount = await Product.countDocuments({});
      if (productCount === 0 && seededCategories['cement'] && seededBrands['UltraTech']) {
        await Product.create([
          {
            name: 'UltraTech Premium OPC 53 Grade',
            brand: seededBrands['UltraTech'],
            category: seededCategories['cement'],
            description: 'High-strength Ordinary Portland Cement (OPC) specially formulated for structural RCC work in slab castings, columns, and high-rise concrete foundations.',
            features: [
              'Exceptional 28-day compressive strength exceeding 53 MPa',
              'Optimal setting times for builders and masonry workers',
              'Superior corrosion resistance for reinforced steel bars'
            ],
            specifications: [
              { name: 'Grade', value: 'OPC 53' },
              { name: 'Packaging Type', value: 'BOPP Laminated Bags' },
              { name: 'Standard Compliance', value: 'IS 12269' },
              { name: 'Net Weight', value: '50 kg' }
            ],
            sizes: ['50kg Bag', 'Bulk Silo Delivery'],
            price: 430,
            stockStatus: 'In Stock',
            availability: true,
            image: '/products/cement/ultratech/1.jpg',
            images: [
              '/products/cement/ultratech/1.jpg',
              '/products/cement/ultratech/2.png',
              '/products/cement/ultratech/3.jpg',
              '/products/cement/ultratech/4.jpg'
            ],
            featured: true,
            bestSeller: true,
            newArrival: false,
            viewCount: 150,
            enquiryCount: 12
          },
          {
            name: 'Ambuja Kawach Premium Cement',
            brand: seededBrands['Ambuja'],
            category: seededCategories['cement'],
            description: 'Premium pozzolana composite water repellent cement featuring active micro-admixtures that guard concrete structures against moisture ingress and efflorescence.',
            features: [
              'Special active water repellent formulation prevents dampness',
              'Higher dense concrete mix prevents chemical leakages',
              'Durable finish withstands high thermal expansions'
            ],
            specifications: [
              { name: 'Grade', value: 'PPC Composite' },
              { name: 'Waterproof Ratio', value: '99% water barrier efficacy' },
              { name: 'Standards Met', value: 'IS 1489 Part 1' },
              { name: 'Net Weight', value: '50 kg' }
            ],
            sizes: ['50kg Bag'],
            price: 445,
            stockStatus: 'In Stock',
            availability: true,
            image: '/products/cement/ambuja/front.png',
            images: [
              '/products/cement/ambuja/front.png',
              '/products/cement/ambuja/back.png',
              '/products/cement/ambuja/powder.png',
              '/products/cement/ambuja/site.png',
              '/products/cement/ambuja/mason.png'
            ],
            featured: true,
            bestSeller: true,
            newArrival: false,
            viewCount: 120,
            enquiryCount: 8
          },
          {
            name: 'Hathi Premium PPC Cement',
            brand: seededBrands['Hathi'] || seededBrands['UltraTech'],
            category: seededCategories['cement'],
            description: 'High-durability Portland Pozzolana Cement (PPC) engineered with premium pozzolanic materials for high concrete impermeability and superior marine structures construction.',
            features: [
              'Excellent resistance to chemical sulfate and chloride attacks',
              'High long-term compressive strength development',
              'Low heat of hydration limits hair-line cracks'
            ],
            specifications: [
              { name: 'Type', value: 'PPC' },
              { name: 'Primary Use', value: 'Plastering, masonry, marine RCC foundations' },
              { name: 'Compliance Standard', value: 'IS 1489' },
              { name: 'Net Weight', value: '50 kg' }
            ],
            sizes: ['50kg Bag'],
            price: 410,
            stockStatus: 'In Stock',
            availability: true,
            image: '/products/cement/hathi/front.png',
            images: [
              '/products/cement/hathi/front.png',
              '/products/cement/hathi/back.png',
              '/products/cement/hathi/powder.png',
              '/products/cement/hathi/site.png',
              '/products/cement/hathi/mason.png'
            ],
            featured: true,
            bestSeller: false,
            newArrival: true,
            viewCount: 80,
            enquiryCount: 5
          },
          {
            name: 'ACC Gold Water Shield Cement',
            brand: seededBrands['ACC'],
            category: seededCategories['cement'],
            description: 'Water-repellent Premium Composite Cement containing water-resistant active chemicals which guard concrete structural parts against dampness and atmospheric moisture.',
            features: [
              'Unique water-repellent engineering prevents moisture seepages',
              'Low heat of hydration limits micro-cracks development',
              'Eco-friendly blend reduces carbon footprint'
            ],
            specifications: [
              { name: 'Type', value: 'Water Shield PSC' },
              { name: 'Water absorption', value: 'Reduced by 50% vs standard OPC' },
              { name: 'Packaging', value: 'Laminated moisture proof bag' },
              { name: 'Net Weight', value: '50 kg' }
            ],
            sizes: ['50kg Bag'],
            price: 450,
            stockStatus: 'In Stock',
            availability: true,
            image: '/cement.jpg',
            images: [
              '/cement.jpg',
              'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
            ],
            featured: true,
            bestSeller: false,
            newArrival: true,
            viewCount: 95,
            enquiryCount: 4
          },
          {
            name: 'Dr. Fixit Super Latex Waterproofing',
            brand: seededBrands['Dr. Fixit'],
            category: seededCategories['chemicals'],
            description: 'High-performance styrene butadiene rubber latex emulsion concrete admixture used for repair of spalled concrete, plastering, waterproofing, and bonding agent applications.',
            features: [
              'Superb bonding strength to concrete, masonry, and stone',
              'Improves tensile strength and flexural strength of mortar',
              'Reduces water permeability by filling microscopic capillary pores'
            ],
            specifications: [
              { name: 'Base Material', value: 'Styrene Butadiene Rubber (SBR)' },
              { name: 'Usage Ratio', value: '1:4 ratios with water/cement mixes' },
              { name: 'Coverage', value: 'approx 70-80 sq.ft per kg for two coats' }
            ],
            sizes: ['1 kg Bottle', '5 kg Container', '10 kg Container', '20 kg Bucket'],
            price: 250,
            stockStatus: 'In Stock',
            availability: true,
            image: '/chemicals.jpg',
            images: [
              '/chemicals.jpg',
              'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80'
            ],
            featured: false,
            bestSeller: false,
            newArrival: true,
            viewCount: 65,
            enquiryCount: 3
          },
          {
            name: 'Godrej Ultra Lock Dual Lever Handle',
            brand: seededBrands['ACC'] || seededBrands['UltraTech'],
            category: seededCategories['hardware'],
            description: 'High-security double-cylinder luxury door lock system with horizontal solid brass latch bolts, premium metallic handle pull plates, and computer-coded dimple keys.',
            features: [
              'Solid brass double throw deadbolt with hardened steel inserts',
              'Computerized dimple keys prevent duplicating and picking',
              'Corrosion resistant electro-plated nickel silver finishing'
            ],
            specifications: [
              { name: 'Lock Type', value: 'Lever Handle Mortise Lock' },
              { name: 'Material', value: 'Zinc Alloy handle plates / Brass keys' },
              { name: 'Key count', value: '4 Dimple keys' }
            ],
            sizes: ['Standard Satin Brass', 'Antique Copper Finish', 'Chrome Polish'],
            price: 2850,
            stockStatus: 'In Stock',
            availability: true,
            image: '/hardware.jpg',
            images: [
              '/hardware.jpg',
              'https://images.unsplash.com/photo-1610527003928-47bd53ef3188?auto=format&fit=crop&w=600&q=80'
            ],
            featured: false,
            bestSeller: true,
            newArrival: false,
            viewCount: 110,
            enquiryCount: 6
          },
          {
            name: 'Jaquar Continental Chrome Basin Mixer',
            brand: seededBrands['Jaquar'],
            category: seededCategories['cp-fittings'],
            description: 'Wall-mounted chrome-plated single lever basin mixer tap featuring advanced ceramic cartridges for smooth water flow, anti-corrosive body, and high-shine coating.',
            features: [
              'High-grade brass body with mirror-polished chrome finish',
              'Advanced 35mm ceramic disk cartridge prevents leakages',
              'Integrated honeycomb aerator provides soft splash-free foam flow'
            ],
            specifications: [
              { name: 'Tap Type', value: 'Single Lever Basin Mixer' },
              { name: 'Material', value: 'De-zincification Brass (DB)' },
              { name: 'Flow Rate', value: 'approx 12.5 Litres per minute' }
            ],
            sizes: ['Polished Chrome', 'Matt Black', 'Graphite Grey', 'Gold Finish'],
            price: 3600,
            stockStatus: 'In Stock',
            availability: true,
            image: '/cp_fittings.jpg',
            images: [
              '/cp_fittings.jpg',
              'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'
            ],
            featured: false,
            bestSeller: true,
            newArrival: false,
            viewCount: 130,
            enquiryCount: 7
          },
          {
            name: 'Astral CPVC Pro Pipes & Tees',
            brand: seededBrands['Astral'],
            category: seededCategories['plumbing'],
            description: 'Premium Chlorinated Polyvinyl Chloride (CPVC) plumbing systems built for pressurized hot and cold water supplies in luxury apartments and industrial installations.',
            features: [
              'Handles hot water temperatures up to 93°C safely',
              'SDR 11 wall thickness handles pressure fluctuations',
              'Lead-free composition protects drinking water hygiene'
            ],
            specifications: [
              { name: 'Material Type', value: 'CPVC SDR 11' },
              { name: 'Working Pressure', value: '28.1 kg/cm² at 23°C' },
              { name: 'Compliance Standard', value: 'ASTM D2846' }
            ],
            sizes: ['1/2 inch', '3/4 inch', '1 inch', '1.5 inch'],
            price: 180,
            stockStatus: 'In Stock',
            availability: true,
            image: '/cp_fittings.jpg',
            images: [
              '/cp_fittings.jpg',
              'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80'
            ],
            featured: false,
            bestSeller: true,
            newArrival: false,
            viewCount: 80,
            enquiryCount: 5
          }
        ]);
        console.log('🌱 Seeded default products for PR Material House');
      }
    }
  } catch (err) {
    console.error('❌ Database seeding failed:', err.message);
  }
};

// Validate required environment variables on startup
const isProd = process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is missing in production!');
  } else {
    console.warn('⚠️ WARNING: JWT_SECRET environment variable is missing. Using insecure development default.');
    process.env.JWT_SECRET = 'insecure_dev_secret_key_123';
  }
}
if (!process.env.MONGODB_URI && isProd) {
  console.error('❌ CRITICAL ERROR: MONGODB_URI environment variable is missing in production!');
}

// Local Development Server Listener
if (!isProd) {
  const startLocalServer = async () => {
    try {
      console.log('⚡ Starting server in local development mode...');
      await connectDB();
      await seedDatabase();
      isSeedingCompleted = true;
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Express Server running in local development mode on port ${PORT}`);
      });
    } catch (err) {
      console.error('❌ Local server failed to start:', err.message);
    }
  };
  startLocalServer();
}

export default app;
