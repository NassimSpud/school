import express from 'express';
import { 
  submitReport,
  getTeacherReports,
  getStudentReports,
  provideFeedback
} from '../controllers/reportController.js';
import { protect, student, teacher } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Submit attachment details (Student only)
router.post(
  '/',
  protect,
  student,
  upload.single('attachment'),
  submitReport
);

// Get all reports for teacher (Teacher only)
router.get(
  '/teacher',
  protect,
  teacher,
  getTeacherReports
);

// Get student's reports (Student only)
router.get(
  '/student',
  protect,
  student,
  getStudentReports
);

// Provide feedback on report (Teacher only)
router.put(
  '/:id/feedback',
  protect,
  teacher,
  provideFeedback
);

export default router;