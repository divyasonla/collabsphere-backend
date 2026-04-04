import mongoose from 'mongoose';

// Serverless / function-friendly mongoose connect with caching
const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    console.error('MONGO_URI is not defined');
    return;
  }

  // Use a global variable so that in serverless environments the
  // connection is reused across invocations.
  const globalWithMongoose = globalThis;
  if (globalWithMongoose._mongoose && globalWithMongoose._mongoose.conn) {
    return globalWithMongoose._mongoose.conn;
  }

  if (!globalWithMongoose._mongoose) globalWithMongoose._mongoose = { conn: null, promise: null };

  if (!globalWithMongoose._mongoose.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    globalWithMongoose._mongoose.promise = mongoose.connect(mongoUri, opts)
      .then((mongooseInstance) => {
        globalWithMongoose._mongoose.conn = mongooseInstance.connection;
        console.log('MongoDB connected');
        return globalWithMongoose._mongoose.conn;
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err && err.message ? err.message : err);
        // don't exit the process in serverless environments; return the rejection
        throw err;
      });
  }

  return globalWithMongoose._mongoose.promise;
};

export default connectDB;
