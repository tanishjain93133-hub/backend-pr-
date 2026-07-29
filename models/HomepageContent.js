import mongoose from 'mongoose';

const homepageContentSchema = new mongoose.Schema({
  heroTitle: {
    type: String,
    required: true,
    default: 'Everything You Need to Build Stronger & Better'
  },
  heroSubtitle: {
    type: String,
    required: true,
    default: 'Premium Cement, Hardware, CP Fittings & Construction Chemicals for Every Project.'
  },
  heroTagline: {
    type: String,
    required: true,
    default: 'Your Trusted Partner for Quality Building Materials'
  },
  heroImage: {
    type: String,
    default: '/cement.jpg'
  },
  heroBgType: {
    type: String,
    enum: ['image', 'video', 'color'],
    default: 'color'
  },
  heroBgUrl: {
    type: String,
    default: ''
  },
  heroBgColor: {
    type: String,
    default: '#F9FAFB'
  },
  heroVideoUrl: {
    type: String,
    default: ''
  },
  heroBtnText: {
    type: String,
    default: 'Explore Products'
  },
  heroBtnLink: {
    type: String,
    default: '/products'
  },
  heroSecBtnText: {
    type: String,
    default: 'Get a Quote'
  },
  heroSecBtnLink: {
    type: String,
    default: '/contact'
  },
  heroAnimation: {
    type: String,
    default: 'fade'
  },
  aboutTitle: {
    type: String,
    default: 'Sourcing the foundations of modern architecture'
  },
  aboutSubtitle: {
    type: String,
    default: 'Established in 2011'
  },
  aboutText: {
    type: String,
    default: 'PR Material House has grown from a local supplier to a premier B2B distributor of industrial cement, structural hardware, designer sanitary fittings, and high-performance concrete chemicals.'
  },
  aboutImage: {
    type: String,
    default: ''
  },
  whyChooseUs: [{
    title: { type: String, required: true },
    desc: { type: String, required: true },
    iconName: { type: String, default: 'ShieldCheck' }
  }],
  stats: [{
    value: { type: String, required: true },
    label: { type: String, required: true }
  }],
  ctaTitle: {
    type: String,
    default: 'Ready to Source Premium Materials?'
  },
  ctaSubtitle: {
    type: String,
    default: 'Connect with our logistics and specifications desk today to receive customized wholesale quotes for bulk supplies.'
  },
  ctaBtnText: {
    type: String,
    default: 'Get a Customized Quote'
  },
  ctaBtnLink: {
    type: String,
    default: '/contact'
  },
  ctaBgImage: {
    type: String,
    default: ''
  },
  featuredCategories: [{
    type: String
  }],
  featuredProducts: [{
    type: String
  }],
  seoTitle: {
    type: String,
    default: 'PR Material House | Premium Structural Supplier'
  },
  seoMetaDescription: {
    type: String,
    default: 'PR Material House supplies premium-grade cement, hardware, CP fittings, and waterproofing chemicals for large construction projects.'
  }
}, { timestamps: true });

const HomepageContent = mongoose.model('HomepageContent', homepageContentSchema);
export default HomepageContent;
