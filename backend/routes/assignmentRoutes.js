// routes/assignmentRoutes.js
import express from 'express';
import { 
  assignStudent, 
  getTeacherStudents,
  getStudentTeacher
} from '../controllers/assignmentController.js';
import { protect, teacher, student } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Assign student to teacher (teacher or admin)
router.post('/assign', teacher, assignStudent);
// Get teacher's students
router.get('/teacher/students', teacher, getTeacherStudents);
// Get student's teacher
router.get('/student/teacher', student, getStudentTeacher);

export default router;