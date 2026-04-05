import mongoose from 'mongoose';

// Connection cache for serverless environments to reuse existing connection
const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

const connectDB = async (mongoUri) => {
  if (!mongoUri) throw new Error('MONGO_URI is not defined');

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Fail faster in serverless so errors surface quickly
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected');
    return cached.conn;
  } catch (err) {
    console.error('MongoDB connection error:', err?.message || err);
    // Clear cached promise so subsequent invocations may retry
    cached.promise = null;
    throw err;
  }
};

export default connectDB;
