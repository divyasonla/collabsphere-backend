import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import { uploadFile, getFile, getFilesByProject, getPublicFilesByProject } from '../controllers/fileController.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g,'_')}`)
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/:id', protect, getFile);
router.get('/project/:projectId', protect, getFilesByProject);
router.get('/public/:id', getPublicFilesByProject);

export default router;
