/**
 * Script to drop the old callId index from calls collection
 * Run this once to fix the duplicate key error
 * 
 * Usage: node scripts/dropCallIdIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.staging' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';

async function dropCallIdIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('calls');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Find and drop callId index
    const callIdIndex = indexes.find(idx => 
      idx.key && idx.key.callId !== undefined
    );

    if (callIdIndex) {
      console.log('Found callId index:', callIdIndex.name);
      await collection.dropIndex(callIdIndex.name);
      console.log('✅ Successfully dropped callId index');
    } else {
      console.log('ℹ️  No callId index found. Nothing to drop.');
    }

    // Show updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes.map(idx => idx.name));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

dropCallIdIndex();

