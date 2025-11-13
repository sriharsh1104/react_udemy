const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';
    
    if (!mongoURI || mongoURI === 'mongodb://localhost:27017/chatapp') {
      console.warn('⚠️  MONGO_URI not set. Using default local MongoDB.');
      console.warn('💡 For Render deployment, set MONGO_URI environment variable.');
      console.warn('   Options: MongoDB Atlas (free) or Render MongoDB Service');
    }
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection options for better reliability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      
      // Connection pooling configuration for scalability
      maxPoolSize: 50, // Maximum number of connections in the pool (default: 100)
      minPoolSize: 5, // Minimum number of connections to maintain (default: 0)
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
      connectTimeoutMS: 10000, // Timeout after 10s when connecting
      
      // Retry configuration
      retryWrites: true, // Retry write operations on network errors
      retryReads: true, // Retry read operations on network errors
      
      // Note: bufferCommands defaults to true, which buffers commands until connection is ready
      // This is safer for production - commands will wait for connection
    });
    
    console.log('✅ MongoDB Connected:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Connection refused. Possible issues:');
      console.error('   1. MongoDB service not running (for local)');
      console.error('   2. MONGO_URI not set correctly (for Render)');
      console.error('   3. Network access not allowed (for MongoDB Atlas)');
      console.error('');
      console.error('📖 Setup Guide: See MONGODB_FREE_SETUP.md');
    } else {
      console.error('💡 Make sure MongoDB is running or check MONGO_URI in environment variables');
    }
    
    // Don't exit in development - allow app to run without DB for testing
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Exiting in production mode due to MongoDB connection failure');
      process.exit(1);
    }
  }
};

module.exports = connectDB;

