import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createProject,
  addMember,
  getProjectsForUser,
  getProjectById,
  getPublicProject,
  contributionAnalytics
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/', protect, createProject);
router.post('/:projectId/members', protect, addMember);
router.get('/', protect, getProjectsForUser);
router.get('/public/:id', getPublicProject);
router.get('/:id', protect, getProjectById);
router.get('/:id/analytics', protect, contributionAnalytics);

export default router;
