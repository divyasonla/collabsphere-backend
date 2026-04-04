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
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Auth token generation will fail on deployed server.');
}
// CORS: allow the deployed frontend origin or default to allow all in dev
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS || null;
const corsOptions = FRONTEND_URL
  ? { origin: FRONTEND_URL.split(',').map(s => s.trim()), credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }
  : { origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] };
app.use(cors(corsOptions));
// ensure preflight requests receive the same CORS headers
app.options('*', cors(corsOptions));

// Request logging for debugging deployed CORS/errors
app.use((req, res, next) => {
  console.log('Incoming request:', { method: req.method, path: req.path, origin: req.get('origin') });
  next();
});
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect DB and start server only after successful DB connection
console.log('CORS allowed origins:', FRONTEND_URL || 'all');

(async () => {
  try {
    await connectDB(MONGO_URI);
    app.get('/api', (req, res) => {
      res.send('CollabSphere API running');
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/notes', notesRoutes);
    app.use('/api/files', fileRoutes);
    app.use('/api/gemini', geminiRoutes);
    app.use('/api/users', userRoutes);

    // Static serve uploads for direct access if needed (keep behind permission in controllers)
    app.use('/uploads', express.static(uploadsDir));

    // Simple health / landing route so GET / doesn't return 404
    app.get('/', (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');
      res.send('CollabSphere API running');
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server due to DB error:', err.stack || err);
    process.exit(1);
  }
})();

app.get('/api', (req, res) => {
  res.send('CollabSphere API running');
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/users', userRoutes);

// Static serve uploads for direct access if needed (keep behind permission in controllers)
app.use('/uploads', express.static(uploadsDir));

// Simple health / landing route so GET / doesn't return 404
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.send('CollabSphere API running');
});
// Error handler
app.use((err, req, res, next) => {
  // log the error and ensure CORS header is present on error responses
  console.error('Server error:', err.stack || err);
  try {
    res.setHeader('Access-Control-Allow-Origin', req.get('origin') || '*');
  } catch (e) {}
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
