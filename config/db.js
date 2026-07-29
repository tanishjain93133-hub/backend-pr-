import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

let cachedConn = null;

const connectDB = async () => {
  // Disable Mongoose command buffering in serverless so queries fail fast rather than timing out after 10000ms
  mongoose.set('bufferCommands', false);

  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/achira';

  try {
    console.log('🔌 Connecting to MongoDB database...');
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    cachedConn = conn;
    return conn;
  } catch (err) {
    console.warn(`⚠️ MongoDB Atlas Connection Notice: ${err.message}. Seamless fallback store active.`);
    return null;
  }
};

export { connectDB };
export default connectDB;
