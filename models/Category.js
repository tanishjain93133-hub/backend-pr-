import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  banner: {
    type: String
  },
  icon: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  hide: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
