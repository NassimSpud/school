import AssessmentVisit from '../models/assessmentVisitModel.js';
import User from '../models/userModel.js';
import Attachment from '../models/attachmentModel.js';
import { io } from '../server.js'; // WebSocket instance

// Create new assessment visit
export const createAssessmentVisit = async (req, res) => {
  try {
    const {
      title,
      description,
      studentId,
      scheduledDate,
      estimatedDuration,
      destination,
      assessmentType,
      travelMode,
      emergencyContact,
      subject,
      semester,
      academicYear
    } = req.body;

    // Validate student exists and is in same department
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student selected' });
    }

    if (req.user.role === 'teacher' && student.department !== req.user.department) {
      return res.status(403).json({ message: 'Cannot create visit for student from different department' });
    }

    const visit = new AssessmentVisit({
      title,
      description,
      teacher: req.user._id,
      student: studentId,
      scheduledDate: new Date(scheduledDate),
      estimatedDuration: estimatedDuration || 60,
      destination,
      assessmentType,
      travelMode: travelMode || 'driving',
      emergencyContact,
      department: req.user.department,
      subject,
      semester,
      academicYear,
      createdBy: req.user._id
    });

    await visit.save();
    await visit.populate('student', 'name email phone schoolId');
    await visit.populate('teacher', 'name email phone');

    // Send notification to student
    await visit.sendStatusNotification('scheduled');

    // Emit real-time notification
    io.to(`student_${studentId}`).emit('assessment_visit_scheduled', {
      visit: visit.toObject(),
      message: `New assessment visit scheduled: ${title}`
    });

    res.status(201).json({
      message: 'Assessment visit created successfully',
      visit
    });
  } catch (error) {
    console.error('Create assessment visit error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get assessment visits (filtered by role)
export const getAssessmentVisits = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, upcoming } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admins can see all visits
    }

    // Status filtering
    if (status) {
      if (status === 'active') {
        query.status = { $in: ['scheduled', 'preparing', 'en_route', 'nearby', 'arrived', 'in_progress'] };
      } else if (status === 'completed') {
        query.status = { $in: ['completed', 'cancelled'] };
      } else {
        query.status = status;
      }
    }

    // Type filtering
    if (type) {
      query.assessmentType = type;
    }

    // Upcoming visits only
    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'preparing', 'en_route', 'nearby'] };
    }

    const visits = await AssessmentVisit.find(query)
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('teacher', 'name email phone profilePicture')
      .populate('student', 'name email phone schoolId')
      .populate('attachments');

    const total = await AssessmentVisit.countDocuments(query);

    res.json({
      visits,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + visits.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get assessment visits error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single assessment visit
export const getAssessmentVisit = async (req, res) => {
  try {
    const visit = await AssessmentVisit.findById(req.params.id)
      .populate('teacher', 'name email phone profilePicture')
      .populate('student', 'name email phone schoolId')
      .populate('attachments')
      .populate('createdBy', 'name email');

    if (!visit) {
      return res.status(404).json({ message: 'Assessment visit not found' });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' ||
                     visit.teacher._id.toString() === req.user._id.toString() ||
                     visit.student._id.toString() === req.user._id.toString();

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Get assessment visit error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update teacher location (real-time tracking)
export const updateTeacherLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const visitId = req.params.id;

    const visit = await AssessmentVisit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ message: 'Assessment visit not found' });
    }

    // Only teacher can update their location
    if (visit.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update location and calculate distance/ETA
    await visit.updateTeacherLocation(latitude, longitude, accuracy);
    await visit.calculateETA();

    // Emit real-time location update to student
    io.to(`student_${visit.student}`).emit('teacher_location_update', {
      visitId: visit._id,
      location: visit.teacherLocation,
      distance: visit.formattedDistance,
      eta: visit.timeUntilArrival,
      status: visit.status
    });

    res.json({
      message: 'Location updated successfully',
      location: visit.teacherLocation,
      distance: visit.formattedDistance,
      eta: visit.timeUntilArrival,
      status: visit.status
    });
  } catch (error) {
    console.error('Update teacher location error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update visit status
export const updateVisitStatus = async (req, res) => {
  try {
    const { status, notes, location } = req.body;
    const visit = await AssessmentVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: 'Assessment visit not found' });
    }

    // Only teacher can update status
    if (visit.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await visit.updateStatus(status, notes, location);

    // Emit real-time status update
    io.to(`student_${visit.student}`).emit('visit_status_update', {
      visitId: visit._id,
      status: visit.status,
      timeline: visit.timeline,
      notes,
      timestamp: new Date()
    });

    res.json({
      message: 'Status updated successfully',
      visit
    });
  } catch (error) {
    console.error('Update visit status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Complete assessment with results
export const completeAssessment = async (req, res) => {
  try {
    const {
      score,
      grade,
      feedback,
      strengths,
      improvements,
      recommendations
    } = req.body;

    const visit = await AssessmentVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Assessment visit not found' });
    }

    // Only teacher can complete assessment
    if (visit.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update assessment results
    visit.assessmentResults = {
      score,
      grade,
      feedback,
      strengths: strengths || [],
      improvements: improvements || [],
      recommendations,
      completedAt: new Date(),
      duration: visit.actualDuration
    };

    await visit.updateStatus('completed', 'Assessment completed with results');

    // Emit completion notification
    io.to(`student_${visit.student}`).emit('assessment_completed', {
      visitId: visit._id,
      results: visit.assessmentResults,
      message: 'Your assessment has been completed'
    });

    res.json({
      message: 'Assessment completed successfully',
      visit
    });
  } catch (error) {
    console.error('Complete assessment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get active visits for student (real-time dashboard)
export const getActiveVisitsForStudent = async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user._id : req.params.studentId;

    // Check permissions
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visits = await AssessmentVisit.getActiveVisitsForStudent(studentId);

    res.json({
      visits,
      count: visits.length
    });
  } catch (error) {
    console.error('Get active visits for student error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get active visits for teacher
export const getActiveVisitsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.role === 'teacher' ? req.user._id : req.params.teacherId;

    // Check permissions
    if (req.user.role === 'teacher' && teacherId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const visits = await AssessmentVisit.getActiveVisitsForTeacher(teacherId);

    res.json({
      visits,
      count: visits.length
    });
  } catch (error) {
    console.error('Get active visits for teacher error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Attach files to assessment visit
export const attachFiles = async (req, res) => {
  try {
    const { attachmentIds } = req.body;
    const visit = await AssessmentVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: 'Assessment visit not found' });
    }

    // Check permissions (teacher or student can attach files)
    const canAttach = visit.teacher.toString() === req.user._id.toString() ||
                     visit.student.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!canAttach) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate attachments exist and user has access
    const attachments = await Attachment.find({
      _id: { $in: attachmentIds },
      $or: [
        { uploadedBy: req.user._id },
        { isPublic: true },
        { allowedUsers: req.user._id }
      ]
    });

    if (attachments.length !== attachmentIds.length) {
      return res.status(400).json({ message: 'Some attachments not found or access denied' });
    }

    // Add attachments to visit
    visit.attachments = [...new Set([...visit.attachments, ...attachmentIds])];
    await visit.save();

    // Update attachment metadata to link to visit
    await Attachment.updateMany(
      { _id: { $in: attachmentIds } },
      {
        $set: {
          relatedModel: 'AssessmentVisit',
          relatedId: visit._id
        }
      }
    );

    await visit.populate('attachments');

    res.json({
      message: 'Files attached successfully',
      attachments: visit.attachments
    });
  } catch (error) {
    console.error('Attach files error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get visit statistics
export const getVisitStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let matchQuery = {
      createdAt: { $gte: startDate },
      isActive: true
    };

    // Role-based filtering
    if (req.user.role === 'teacher') {
      matchQuery.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      matchQuery.student = req.user._id;
    }

    const stats = await AssessmentVisit.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$assessmentResults.duration' }
        }
      }
    ]);

    const typeStats = await AssessmentVisit.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$assessmentType',
          count: { $sum: 1 },
          avgScore: { $avg: '$assessmentResults.score' }
        }
      }
    ]);

    const totalVisits = await AssessmentVisit.countDocuments(matchQuery);
    const completedVisits = await AssessmentVisit.countDocuments({
      ...matchQuery,
      status: 'completed'
    });

    res.json({
      totalVisits,
      completedVisits,
      completionRate: totalVisits > 0 ? (completedVisits / totalVisits * 100).toFixed(1) : 0,
      statusBreakdown: stats,
      typeBreakdown: typeStats,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Get visit statistics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel assessment visit
export const cancelAssessmentVisit = async (req, res) => {
  try {
    const { reason } = req.body;
    const visit = await AssessmentVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: 'Assessment visit not found' });
    }

    // Only teacher or admin can cancel
    if (visit.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await visit.updateStatus('cancelled', reason || 'Visit cancelled');

    // Emit cancellation notification
    io.to(`student_${visit.student}`).emit('visit_cancelled', {
      visitId: visit._id,
      reason,
      message: 'Your assessment visit has been cancelled'
    });

    res.json({
      message: 'Assessment visit cancelled successfully',
      visit
    });
  } catch (error) {
    console.error('Cancel assessment visit error:', error);
    res.status(500).json({ message: error.message });
  }
};
