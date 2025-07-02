import Report from '../models/reportModel.js';
import { createNotification } from './notificationController.js';
import User from '../models/userModel.js';

// @desc    Submit attachment details
// @route   POST /api/reports
// @access  Private (Student)
export const submitReport = async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      companyName,
      location,
      verifiedLocation,
      industryType,
      supervisorName,
      supervisorContact,
      supervisorEmail,
      startDate,
      endDate,
      weeklyHours
    } = req.body;

    // Verify student has a teacher assigned
    const student = await User.findById(req.user._id);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get teacher information
    const teacher = await User.findById(student.teacher);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'No valid teacher assigned' });
    }

    // Verify department match
    if (student.department !== teacher.department) {
      return res.status(400).json({ message: 'Teacher and student must be in the same department' });
    }

    // Create new report
    const report = new Report({
      student: student._id,
      teacher: teacher._id,
      studentName,
      studentId,
      companyName,
      location,
      verifiedLocation,
      industryType,
      supervisorName,
      supervisorContact,
      supervisorEmail,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      weeklyHours: parseInt(weeklyHours, 10),
      attachment: req.file ? req.file.filename : undefined
    });

    // Save report
    await report.save();

    // Create notification for teacher
    await createNotification(teacher._id, {
      type: 'new_report',
      message: `New report submitted by ${studentName}`,
      reportId: report._id
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Report submission error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private (Admin/Teacher/Student)
export const getAllReports = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    let query = {};
    
    // Students can only see their own reports
    if (currentUser.role === 'student') {
      query.student = currentUser._id;
      return res.json(await Report.find(query)
        .populate('teacher', 'name email department')
        .select('-__v'));
    }

    // Teachers can see all reports from their students
    if (currentUser.role === 'teacher') {
      const students = await User.find({
        role: 'student',
        teacher: currentUser._id,
        department: currentUser.department
      });
      
      if (students.length === 0) {
        return res.json([]);
      }
      
      query.student = { $in: students.map(s => s._id) };
      return res.json(await Report.find(query)
        .populate('student teacher', 'name email department')
        .select('-__v'));
    }

    // Admins (HODs) can see reports from their department
    if (currentUser.role === 'admin' && currentUser.department) {
      const students = await User.find({
        role: 'student',
        department: currentUser.department
      });
      
      if (students.length === 0) {
        return res.json([]);
      }
      
      query.student = { $in: students.map(s => s._id) };
      return res.json(await Report.find(query)
        .populate('student teacher', 'name email department')
        .select('-__v'));
    }

    // Super admins can see all reports
    const reports = await Report.find()
      .populate('student teacher', 'name email department')
      .select('-__v');
    
    res.json(reports);
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student's reports
// @route   GET /api/reports/student
// @access  Private (Student)
export const getStudentReports = async (req, res) => {
  try {
    const reports = await Report.find({ student: req.user._id })
      .populate('teacher', 'name email')
      .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Provide feedback on a report
// @route   PUT /api/reports/:id/feedback
// @access  Private (Teacher)
export const provideFeedback = async (req, res) => {
  try {
    const { feedback, grade, status } = req.body;
    
    const report = await Report.findById(req.params.id)
      .populate('student', 'name');
    
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }

    // Check if teacher is authorized
    if (report.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to provide feedback on this report' 
      });
    }

    // Update report
    report.feedback = feedback;
    if (grade) report.grade = grade;
    if (status) report.status = status;
    report.reviewedAt = Date.now();

    const updatedReport = await report.save();

    // Create notification for student
    await createNotification({
      recipientId: report.student._id,
      senderId: req.user._id,
      type: 'report_feedback',
      title: 'Attachment Feedback Available',
      message: `${req.user.name} has provided feedback on your attachment details`,
      relatedEntity: updatedReport._id,
      onModel: 'Report',
      priority: 'medium'
    });

    res.json({
      success: true,
      data: updatedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};