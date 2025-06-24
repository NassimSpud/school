// backend/routes/userRoutes.js
import express from 'express';
import { 
  getUserById,
  updateUser,
  getTeacherDashboard
} from '../controllers/userController.js';
import { protect, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all user routes
router.use(protect);

// User routes (accessible to authenticated users)
router.get('/teacher/dashboard', teacher, getTeacherDashboard);
router.route('/:id')
  .get(getUserById)    // Get user profile
  .put(updateUser);    // Update user profile

export default router;