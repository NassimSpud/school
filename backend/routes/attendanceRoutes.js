import express from 'express';
import { 
    getAttendance,
    updateAttendance
} from '../controllers/attendanceController.js';
import { protect, admin, teacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get attendance for a class (Admin and Teacher)
router.get('/:classId', protect, getAttendance);

// Update attendance (Teacher only)
router.post('/update', protect, teacher, updateAttendance);

export default router;
