import mongoose from 'mongoose';

const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

export default async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI is not defined');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // fail fast if cannot connect
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(uri, opts).then(m => {
      console.log('MongoDB connection established');
      return m.connection;
    }).catch(err => {
      console.error('MongoDB initial connection error:', err.message || err);
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}