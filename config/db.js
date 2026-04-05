import mongoose from 'mongoose';

const connectDB = async (mongoUri) => {
  if (!mongoUri) throw new Error('MONGO_URI is not defined');
  try {
    // Add a serverSelectionTimeoutMS so failed connections fail fast in serverless
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    // Log the error but do not exit the process; let the caller decide how to handle it.
    console.error('MongoDB connection error:', err.message || err);
    throw err;
  }
};

export default connectDB;
