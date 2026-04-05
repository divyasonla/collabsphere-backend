import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createProject,
  addMember,
  getProjectsForUser,
  getProjectById,
  getPublicProject,
  contributionAnalytics,
  shareProject,
  unshareProject,
  deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/', protect, createProject);
router.post('/:projectId/members', protect, addMember);
router.get('/', protect, getProjectsForUser);
router.get('/public/:id', getPublicProject);
router.post('/:id/share', protect, shareProject);
router.post('/:id/unshare', protect, unshareProject);
router.delete('/:id', protect, deleteProject);
router.get('/:id', protect, getProjectById);
router.get('/:id/analytics', protect, contributionAnalytics);

export default router;
