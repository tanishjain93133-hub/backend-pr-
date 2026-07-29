import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  specifications: [{
    name: { type: String, required: true },
    value: { type: String, required: true }
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    default: 0
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Out of Stock', 'Contact Us'],
    default: 'In Stock'
  },
  availability: {
    type: Boolean,
    default: true
  },
  hide: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  enquiryCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  },
  versions: [{
    type: Object
  }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
