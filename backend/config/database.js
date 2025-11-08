const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';
    
    if (!mongoURI || mongoURI === 'mongodb://localhost:27017/chatapp') {
      console.warn('⚠️  MONGODB_URI not set. Using default local MongoDB.');
      console.warn('💡 For Render deployment, set MONGODB_URI environment variable.');
      console.warn('   Options: MongoDB Atlas (free) or Render MongoDB Service');
    }
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options for better reliability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ MongoDB Connected:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Connection refused. Possible issues:');
      console.error('   1. MongoDB service not running (for local)');
      console.error('   2. MONGODB_URI not set correctly (for Render)');
      console.error('   3. Network access not allowed (for MongoDB Atlas)');
      console.error('');
      console.error('📖 Setup Guide: See MONGODB_FREE_SETUP.md');
    } else {
      console.error('💡 Make sure MongoDB is running or check MONGODB_URI in environment variables');
    }
    
    // Don't exit in development - allow app to run without DB for testing
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting in production mode due to MongoDB connection failure');
      process.exit(1);
    }
  }
};

module.exports = connectDB;

