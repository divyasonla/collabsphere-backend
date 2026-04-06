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

// Configure CORS: allow the frontend origin from environment or allow all in dev
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_API_BASE || '*';
const corsOptions = {
  // when FRONTEND_URL is '*', allow any origin but disable credentials
  origin: FRONTEND_URL === '*' ? true : FRONTEND_URL,
  credentials: FRONTEND_URL === '*' ? false : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};
console.log('CORS configured. frontend allowed origin:', FRONTEND_URL === '*' ? 'any' : FRONTEND_URL);
app.use(cors(corsOptions));

// Ensure preflight requests are handled for all routes with same options
app.options('*', cors(corsOptions));
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

// Connect DB only if MONGO_URI is provided. In serverless environments
// the environment variable may be set in deployment settings; avoid
// throwing synchronously here which crashes the function on import.
if (MONGO_URI) {
  connectDB(MONGO_URI).catch(err => console.error('DB connection error:', err));
} else {
  console.warn('MONGO_URI not set - skipping DB connection');
}

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

// Export the app for serverless platforms (Vercel) and local start
export default app;

// Only listen when running locally (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
