import express from 'express';
import {
  createHomework,
  getAllHomework,
  getHomework,
  updateHomework,
  deleteHomework,
  assignStudents,
  submitHomework,
  getHomeworkSubmissions,
  gradeSubmission,
  getStudentSubmissions
} from '../controllers/homeworkController.js';
import { protect, admin, teacher, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Homework CRUD operations
router.post('/', teacher, createHomework);
router.get('/', getAllHomework);
router.get('/:id', getHomework);
router.put('/:id', teacher, updateHomework);
router.delete('/:id', teacher, deleteHomework);

// Student assignment
router.post('/:id/assign', teacher, assignStudents);

// Homework submission
router.post('/:id/submit', student, submitHomework);

// Get submissions for homework (teachers)
router.get('/:id/submissions', teacher, getHomeworkSubmissions);

// Grade submission (teachers)
router.put('/submissions/:submissionId/grade', teacher, gradeSubmission);

// Get student's submissions
router.get('/student/submissions', getStudentSubmissions);
router.get('/student/:studentId/submissions', teacher, getStudentSubmissions);

export default router;
