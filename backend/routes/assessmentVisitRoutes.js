import express from 'express';
import {
  createAssessmentVisit,
  getAssessmentVisits,
  getAssessmentVisit,
  updateTeacherLocation,
  updateVisitStatus,
  completeAssessment,
  getActiveVisitsForStudent,
  getActiveVisitsForTeacher,
  attachFiles,
  getVisitStatistics,
  cancelAssessmentVisit
} from '../controllers/assessmentVisitController.js';
import { protect, admin, teacher, student } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Assessment visit CRUD operations
router.post('/', teacher, createAssessmentVisit);
router.get('/', getAssessmentVisits);
router.get('/statistics', getVisitStatistics);
router.get('/:id', getAssessmentVisit);

// Real-time location and status updates
router.put('/:id/location', teacher, updateTeacherLocation);
router.put('/:id/status', teacher, updateVisitStatus);

// Assessment completion
router.put('/:id/complete', teacher, completeAssessment);

// File attachments
router.post('/:id/attachments', attachFiles);

// Active visits for real-time dashboard
router.get('/active/student', student, getActiveVisitsForStudent);
router.get('/active/teacher', teacher, getActiveVisitsForTeacher);
router.get('/active/student/:studentId', teacher, getActiveVisitsForStudent);
router.get('/active/teacher/:teacherId', admin, getActiveVisitsForTeacher);

// Visit management
router.put('/:id/cancel', teacher, cancelAssessmentVisit);

export default router;
