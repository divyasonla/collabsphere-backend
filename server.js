import dotenv from 'dotenv';
// load environment variables as early as possible so other modules can read them
dotenv.config();

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cors from 'cors';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ensure uploads dir exists (relative to this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
// Allow CORS including Authorization header for frontend requests
app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect DB
connectDB(MONGO_URI).catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/users', userRoutes);

// Static serve uploads for direct access if needed (keep behind permission in controllers)
app.use('/uploads', express.static(uploadsDir));
// Error handler
app.use((err, req, res, next) => {
//   console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
