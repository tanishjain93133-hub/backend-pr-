import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const test = async () => {
  try {
    await connectDB();
    const username = 'admin';
    const password = 'admin123';
    
    const user = await User.findOne({ 
      $or: [{ username }, { email: username.toLowerCase() }] 
    });
    
    if (!user) {
      console.log('❌ User admin not found in the DB!');
      return;
    }
    
    console.log('Found user:', user.username, 'email:', user.email, 'hashedPassword:', user.password);
    
    const isMatch = await user.comparePassword(password);
    console.log('Password match test:', isMatch ? '✅ MATCH!' : '❌ WRONG PASSWORD!');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

test();
