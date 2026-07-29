import mongoose from 'mongoose';

const websiteConfigSchema = new mongoose.Schema({
  websiteName: {
    type: String,
    default: 'PR Material House'
  },
  companyLogo: {
    type: String,
    default: '/favicon.svg'
  },
  favicon: {
    type: String,
    default: '/favicon.svg'
  },
  colors: {
    primary: { type: String, default: '#1F2937' }, // Dark Gray
    accent: { type: String, default: '#F97316' },  // Orange
    background: { type: String, default: '#FFFFFF' },
    lightGray: { type: String, default: '#F3F4F6' }
  },
  fonts: {
    headings: { type: String, default: 'Outfit' },
    body: { type: String, default: 'Plus Jakarta Sans' }
  },
  socialLinks: {
    facebook: { type: String, default: '#' },
    linkedin: { type: String, default: '#' },
    twitter: { type: String, default: '#' }
  },
  seo: {
    title: { type: String, default: 'PR Material House | Premium Building Material Supplier' },
    metaDescription: { type: String, default: 'PR Material House supplies premium quality cement, hardware, CP fittings, construction chemicals, TMT steel, and other building materials.' },
    metaKeywords: { type: String, default: 'cement, hardware, cp fittings, construction chemicals, plumbing, tiles, paints, sanitaryware, TMT steel' }
  },
  header: {
    announcementBar: { type: String, default: 'Trusted B2B Supplier for Contractors & Builders' },
    showAnnouncement: { type: Boolean, default: true }
  },
  footer: {
    copyrightText: { type: String, default: '© 2026 PR Material House. All rights reserved.' },
    aboutSnippet: { type: String, default: 'Standard-setting distributor of high-grade construction materials, supporting major developers and builders.' }
  },
  googleAnalyticsId: {
    type: String,
    default: ''
  },
  facebookPixelId: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const WebsiteConfig = mongoose.model('WebsiteConfig', websiteConfigSchema);
export default WebsiteConfig;
