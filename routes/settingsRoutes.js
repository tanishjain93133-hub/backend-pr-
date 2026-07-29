import express from 'express';
import ContactDetail from '../models/ContactDetail.js';
import HomepageContent from '../models/HomepageContent.js';
import WebsiteConfig from '../models/WebsiteConfig.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload, getFileUrl } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @desc    Get website CMS settings
// @route   GET /api/settings/website
router.get('/website', async (req, res) => {
  try {
    let config = await WebsiteConfig.findOne();
    if (!config) {
      config = await WebsiteConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update website CMS settings
// @route   PUT /api/settings/website
router.put('/website', protect, admin, upload.fields([
  { name: 'logoFile', maxCount: 1 },
  { name: 'faviconFile', maxCount: 1 }
]), async (req, res) => {
  try {
    let config = await WebsiteConfig.findOne();
    if (!config) {
      config = new WebsiteConfig({});
    }

    // Assign text fields
    if (req.body.websiteName) config.websiteName = req.body.websiteName;
    
    // Parse nested objects if sent as JSON strings or raw properties
    if (req.body.colors) {
      const colors = typeof req.body.colors === 'string' ? JSON.parse(req.body.colors) : req.body.colors;
      config.colors = { ...config.colors, ...colors };
    }
    if (req.body.fonts) {
      const fonts = typeof req.body.fonts === 'string' ? JSON.parse(req.body.fonts) : req.body.fonts;
      config.fonts = { ...config.fonts, ...fonts };
    }
    if (req.body.socialLinks) {
      const socialLinks = typeof req.body.socialLinks === 'string' ? JSON.parse(req.body.socialLinks) : req.body.socialLinks;
      config.socialLinks = { ...config.socialLinks, ...socialLinks };
    }
    if (req.body.seo) {
      const seo = typeof req.body.seo === 'string' ? JSON.parse(req.body.seo) : req.body.seo;
      config.seo = { ...config.seo, ...seo };
    }
    if (req.body.header) {
      const header = typeof req.body.header === 'string' ? JSON.parse(req.body.header) : req.body.header;
      config.header = { ...config.header, ...header };
    }
    if (req.body.footer) {
      const footer = typeof req.body.footer === 'string' ? JSON.parse(req.body.footer) : req.body.footer;
      config.footer = { ...config.footer, ...footer };
    }

    // Handle file uploads for Logo & Favicon
    if (req.files) {
      if (req.files.logoFile && req.files.logoFile[0]) {
        const logoUrl = getFileUrl(req.files.logoFile[0]);
        if (logoUrl) config.companyLogo = logoUrl;
      }
      if (req.files.faviconFile && req.files.faviconFile[0]) {
        const faviconUrl = getFileUrl(req.files.faviconFile[0]);
        if (faviconUrl) config.favicon = faviconUrl;
      }
    }

    // Allow raw URL fallback if no files are uploaded
    if (req.body.companyLogo && !req.files?.logoFile) config.companyLogo = req.body.companyLogo;
    if (req.body.favicon && !req.files?.faviconFile) config.favicon = req.body.favicon;

    // Analytics integrations
    if (req.body.googleAnalyticsId !== undefined) config.googleAnalyticsId = req.body.googleAnalyticsId;
    if (req.body.facebookPixelId !== undefined) config.facebookPixelId = req.body.facebookPixelId;

    const updatedConfig = await config.save();
    res.json(updatedConfig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get contact details
// @route   GET /api/settings/contact
router.get('/contact', async (req, res) => {
  try {
    let details = await ContactDetail.findOne();
    if (!details) {
      details = await ContactDetail.create({});
    }
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update contact details (admin only)
// @route   PUT /api/settings/contact
router.put('/contact', protect, admin, async (req, res) => {
  const { phone, email, address, googleMapUrl, whatsappNumber } = req.body;
  try {
    let details = await ContactDetail.findOne();
    if (!details) {
      details = new ContactDetail({});
    }
    details.phone = phone || details.phone;
    details.email = email || details.email;
    details.address = address || details.address;
    details.googleMapUrl = googleMapUrl || details.googleMapUrl;
    details.whatsappNumber = whatsappNumber || details.whatsappNumber;

    const updated = await details.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get homepage text details
// @route   GET /api/settings/homepage
router.get('/homepage', async (req, res) => {
  try {
    let content = await HomepageContent.findOne();
    if (!content) {
      content = await HomepageContent.create({});
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update homepage text (admin only)
// @route   PUT /api/settings/homepage
router.put('/homepage', protect, admin, upload.fields([
  { name: 'heroImageFile', maxCount: 1 },
  { name: 'aboutImageFile', maxCount: 1 },
  { name: 'ctaBgImageFile', maxCount: 1 }
]), async (req, res) => {
  try {
    let content = await HomepageContent.findOne();
    if (!content) {
      content = new HomepageContent({});
    }

    // Direct String / Text Fields
    if (req.body.heroTitle !== undefined) content.heroTitle = req.body.heroTitle;
    if (req.body.heroSubtitle !== undefined) content.heroSubtitle = req.body.heroSubtitle;
    if (req.body.heroTagline !== undefined) content.heroTagline = req.body.heroTagline;
    
    if (req.body.heroBgType !== undefined) content.heroBgType = req.body.heroBgType;
    if (req.body.heroBgUrl !== undefined) content.heroBgUrl = req.body.heroBgUrl;
    if (req.body.heroBgColor !== undefined) content.heroBgColor = req.body.heroBgColor;
    if (req.body.heroVideoUrl !== undefined) content.heroVideoUrl = req.body.heroVideoUrl;
    
    if (req.body.heroBtnText !== undefined) content.heroBtnText = req.body.heroBtnText;
    if (req.body.heroBtnLink !== undefined) content.heroBtnLink = req.body.heroBtnLink;
    if (req.body.heroSecBtnText !== undefined) content.heroSecBtnText = req.body.heroSecBtnText;
    if (req.body.heroSecBtnLink !== undefined) content.heroSecBtnLink = req.body.heroSecBtnLink;
    
    if (req.body.heroAnimation !== undefined) content.heroAnimation = req.body.heroAnimation;
    
    if (req.body.aboutTitle !== undefined) content.aboutTitle = req.body.aboutTitle;
    if (req.body.aboutSubtitle !== undefined) content.aboutSubtitle = req.body.aboutSubtitle;
    if (req.body.aboutText !== undefined) content.aboutText = req.body.aboutText;
    
    if (req.body.ctaTitle !== undefined) content.ctaTitle = req.body.ctaTitle;
    if (req.body.ctaSubtitle !== undefined) content.ctaSubtitle = req.body.ctaSubtitle;
    if (req.body.ctaBtnText !== undefined) content.ctaBtnText = req.body.ctaBtnText;
    if (req.body.ctaBtnLink !== undefined) content.ctaBtnLink = req.body.ctaBtnLink;
    
    if (req.body.seoTitle !== undefined) content.seoTitle = req.body.seoTitle;
    if (req.body.seoMetaDescription !== undefined) content.seoMetaDescription = req.body.seoMetaDescription;

    // Parsed Array / Object Fields
    if (req.body.whyChooseUs) {
      content.whyChooseUs = typeof req.body.whyChooseUs === 'string' ? JSON.parse(req.body.whyChooseUs) : req.body.whyChooseUs;
    }
    if (req.body.stats) {
      content.stats = typeof req.body.stats === 'string' ? JSON.parse(req.body.stats) : req.body.stats;
    }
    if (req.body.featuredCategories) {
      content.featuredCategories = typeof req.body.featuredCategories === 'string' ? JSON.parse(req.body.featuredCategories) : req.body.featuredCategories;
    }
    if (req.body.featuredProducts) {
      content.featuredProducts = typeof req.body.featuredProducts === 'string' ? JSON.parse(req.body.featuredProducts) : req.body.featuredProducts;
    }

    // File Uploads
    if (req.files) {
      if (req.files.heroImageFile && req.files.heroImageFile[0]) {
        content.heroImage = `/uploads/${req.files.heroImageFile[0].filename}`;
      }
      if (req.files.aboutImageFile && req.files.aboutImageFile[0]) {
        content.aboutImage = `/uploads/${req.files.aboutImageFile[0].filename}`;
      }
      if (req.files.ctaBgImageFile && req.files.ctaBgImageFile[0]) {
        content.ctaBgImage = `/uploads/${req.files.ctaBgImageFile[0].filename}`;
      }
    }

    // Direct url fallback assignments
    if (req.body.heroImage && (!req.files || !req.files.heroImageFile)) content.heroImage = req.body.heroImage;
    if (req.body.aboutImage && (!req.files || !req.files.aboutImageFile)) content.aboutImage = req.body.aboutImage;
    if (req.body.ctaBgImage && (!req.files || !req.files.ctaBgImageFile)) content.ctaBgImage = req.body.ctaBgImage;

    const updated = await content.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export { router };
export default router;
