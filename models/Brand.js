import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  logo: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  banner: {
    type: String
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
