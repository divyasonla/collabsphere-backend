import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createNote, updateNote, deleteNote, getNotesByProject } from '../controllers/notesController.js';

const router = express.Router();

router.post('/project/:projectId', protect, createNote);
router.get('/project/:projectId', protect, getNotesByProject);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);

export default router;
