import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  assignSchoolSupervisor,
  assignStudentClass,
  createClass,
  createCompany,
  createCompanySupervisor,
  getAttachmentApplications,
  getAttachmentOverview,
  getClasses,
  getCompanies,
  getDepartments,
  getSchoolSupervisors,
  inviteCompanySupervisor,
  reviewAttachmentApplication
} from '../controllers/amsController.js';

const router = express.Router();

router.use(protect, admin);

router.get('/attachments', getAttachmentOverview);
router.get('/school-supervisors', getSchoolSupervisors);
router.post('/assignments', assignSchoolSupervisor);

router.get('/attachment-applications', getAttachmentApplications);
router.patch('/attachment-applications/:id', reviewAttachmentApplication);

router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.post('/companies/:companyId/supervisors', createCompanySupervisor);
router.post('/company-supervisors/:id/invite', inviteCompanySupervisor);

router.get('/departments', getDepartments);
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.patch('/students/:id/class', assignStudentClass);

export default router;
