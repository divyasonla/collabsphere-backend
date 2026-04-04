import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { explain, docs, readme } from '../controllers/geminiController.js';

const router = express.Router();

router.post('/explain', protect, explain);
router.post('/docs', protect, docs);
router.post('/readme', protect, readme);

export default router;
