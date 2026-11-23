import express from 'express';
import { protect, student, teacher } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  createAttachmentApplication,
  createLogbookEntry,
  createReport,
  createWeeklySummary,
  deleteLogbookEntry,
  downloadReport,
  getLogbookEntries,
  getMyAttachmentApplications,
  getReports,
  getStudentDashboard,
  getSupervisorDashboard,
  getWeeklySummaries,
  reviewLogbookEntry,
  reviewReport,
  updateLogbookEntry
} from '../controllers/amsController.js';

const router = express.Router();
const reportUpload = uploadSingle('report_attachment');

const companySupervisor = (req, res, next) => {
  if (req.user?.role === 'company_supervisor') return next();
  return res.status(403).json({ message: 'Not authorized as company supervisor' });
};

const supervisor = (req, res, next) => {
  if (req.user?.role === 'teacher' || req.user?.role === 'company_supervisor') return next();
  return res.status(403).json({ message: 'Not authorized as supervisor' });
};

router.use(protect);

router.get('/dashboard', student, getStudentDashboard);
router.get('/supervisor/dashboard', supervisor, getSupervisorDashboard);

router.get('/applications', student, getMyAttachmentApplications);
router.post('/applications', student, createAttachmentApplication);

router.get('/logbook', getLogbookEntries);
router.post('/logbook', student, createLogbookEntry);
router.patch('/logbook/:id', student, updateLogbookEntry);
router.delete('/logbook/:id', student, deleteLogbookEntry);
router.patch('/logbook/:id/review', companySupervisor, reviewLogbookEntry);

router.get('/weekly-summaries', getWeeklySummaries);
router.post('/weekly-summaries', student, createWeeklySummary);

router.get('/reports', getReports);
router.post('/reports', student, (req, res, next) => {
  req.params.uploadType = 'report_attachment';
  next();
}, ...reportUpload, createReport);
router.patch('/reports/:id/review', supervisor, reviewReport);
router.get('/reports/:id/download', downloadReport);

export default router;
