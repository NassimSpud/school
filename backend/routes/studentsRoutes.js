// backend/routes/studentsRoutes.js
import express from 'express';
import {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} from '../controllers/studentsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin routes
router.use(admin);

// Get all students (admin only)
router.get('/', getAllStudents);

// Get single student by ID
router.get('/:id', getStudentById);

// Update student
router.put('/:id', updateStudent);

// Delete student
router.delete('/:id', deleteStudent);

// Assign supervisor to student(s)
router.post('/:studentId/assign-supervisor', assignSupervisor);

export default router;
