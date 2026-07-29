import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const reset = async () => {
  try {
    await connectDB();
    
    // Delete existing records to avoid unique constraint violations
    await User.deleteMany({ username: 'admin' });
    await User.deleteMany({ email: 'admin@prmaterial.com' });
    
    // Insert clean default administrator account
    const admin = await User.create({
      _id: '60c72b2f9b1d8b2bad123456',
      username: 'admin',
      email: 'admin@prmaterial.com',
      password: 'admin123',
      role: 'admin'
    });
    
    console.log('✅ Admin user reset successfully!');
    console.log('Username: admin');
    console.log('Email: admin@prmaterial.com');
    console.log('Password: admin123');
  } catch (err) {
    console.error('❌ Failed to reset admin user:', err);
  } finally {
    await mongoose.disconnect();
  }
};

reset();
