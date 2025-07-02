// backend/routes/userRoutes.js
import express from 'express';
import { 
  getUserById,
  updateUser,
  getTeacherDashboard,
  assignTeacherToStudent
} from '../controllers/userController.js';
import { protect, teacher, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all user routes
router.use(protect);

// User routes (accessible to authenticated users)
router.get('/teacher/dashboard', teacher, getTeacherDashboard);
router.route('/:id')
  .get(getUserById)    // Get user profile
  .put(updateUser);    // Update user profile

// Admin route to assign a teacher to a student
router.put('/students/:studentId/assign-teacher', protect, admin, assignTeacherToStudent);

export default router;