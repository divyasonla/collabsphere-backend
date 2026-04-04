import mongoose from 'mongoose';

const connectDB = async (mongoUri) => {
  if (!mongoUri) throw new Error('MONGO_URI is not defined');
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;
