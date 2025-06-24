import Report from '../models/reportModel.js';
import { createNotification } from './notificationController.js';

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

    // Check if student has a teacher assigned
    if (!req.user.teacher) {
      return res.status(400).json({ 
        message: 'No teacher assigned to this student' 
      });
    }

    // Create new report with attachment details
    const report = new Report({
      student: req.user._id,
      teacher: req.user.teacher,
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

    // Save to database
    const createdReport = await report.save();

    // Create notification for teacher
    await createNotification({
      recipientId: req.user.teacher,
      senderId: req.user._id,
      type: 'new_report',
      title: 'New Attachment Details Submitted',
      message: `${req.user.name} has submitted new attachment details for ${companyName}`,
      relatedEntity: createdReport._id,
      onModel: 'Report',
      priority: 'high'
    });

    // Return success response
    res.status(201).json({
      success: true,
      data: createdReport
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

// @desc    Get all reports for teacher
// @route   GET /api/reports/teacher
// @access  Private (Teacher)
export const getTeacherReports = async (req, res) => {
  try {
    const reports = await Report.find({ teacher: req.user._id })
      .populate('student', 'name email schoolId')
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