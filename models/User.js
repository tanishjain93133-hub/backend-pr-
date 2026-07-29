import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'editor', 'manager'],
    default: 'customer'
  },
  permissions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  },
  phone: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Pre-save hook to hash passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
