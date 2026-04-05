import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import geminiRoutes from './routes/geminiRoutes.js';
import cors from 'cors';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// ensure uploads dir exists (relative to this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple request logger to help debug routing/auth issues
// app.use((req, res, next) => {
//   try {
//     const authPresent = !!req.headers.authorization;
//     // console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} auth=${authPresent}`);
//   } catch (e) {
//     // ignore logging errors
//   }
//   next();
// });

// Connect DB
connectDB(MONGO_URI).catch(err => console.error(err));

// Routes
app.get('/api', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/gemini', geminiRoutes);

// Static serve uploads for direct access if needed (keep behind permission in controllers)
app.use('/uploads', express.static(uploadsDir));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
