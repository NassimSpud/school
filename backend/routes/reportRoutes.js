import express from 'express';
import { 
  submitReport,
  getAllReports,
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

// Get all reports (Teacher only)
router.get(
  '/',
  protect,
  teacher,
  getAllReports
);

// Get announcements/messages for student (Student only)
router.get(
  '/announcements',
  protect,
  student,
  async (req, res) => {
    try {
      const student = await User.findById(req.user._id);
      if (!student || student.role !== 'student') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Get teacher information
      const teacher = await User.findById(student.teacher);
      
      // Get student's reports and messages
      const reports = await Report.find({ student: student._id })
        .populate('teacher', 'name email')
        .sort({ createdAt: -1 });

      // Get messages from teacher
      const messages = await Message.find({
        recipient: student._id,
        sender: teacher._id
      })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });

      res.json({
        supervisor: teacher,
        reports,
        messages
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
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