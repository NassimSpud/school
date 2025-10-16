import Homework from '../models/homeworkModel.js';
import HomeworkSubmission from '../models/homeworkSubmissionModel.js';
import Attachment from '../models/attachmentModel.js';
import User from '../models/userModel.js';

// Create homework (teachers only)
export const createHomework = async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      subject,
      dueDate,
      maxPoints,
      allowedFileTypes,
      maxFileSize,
      maxFiles,
      allowLateSubmission,
      lateSubmissionPenalty,
      assignToDepartment
    } = req.body;

    const homework = new Homework({
      title,
      description,
      instructions,
      createdBy: req.user._id,
      department: req.user.department,
      subject,
      dueDate: new Date(dueDate),
      maxPoints: maxPoints || 100,
      allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx', 'txt'],
      maxFileSize: maxFileSize || 10485760, // 10MB
      maxFiles: maxFiles || 5,
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty: lateSubmissionPenalty || 0
    });

    await homework.save();

    // Auto-assign to department students if requested
    if (assignToDepartment) {
      await homework.assignToDepartmentStudents();
    }

    await homework.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Homework created successfully',
      homework
    });
  } catch (error) {
    console.error('Create homework error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all homework (filtered by role)
export const getAllHomework = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role === 'teacher') {
      // Teachers see homework they created
      query.createdBy = req.user._id;
    } else if (req.user.role === 'student') {
      // Students see homework assigned to them
      query.assignedTo = req.user._id;
      if (status === 'active') {
        query.isActive = true;
      }
    } else if (req.user.role === 'admin') {
      // Admins see all homework
      if (status === 'active') {
        query.isActive = true;
      }
    }

    const homework = await Homework.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name schoolId');

    const total = await Homework.countDocuments(query);

    res.json({
      homework,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + homework.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all homework error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get homework by ID
export const getHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name schoolId email');

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' ||
                     homework.createdBy._id.toString() === req.user._id.toString() ||
                     homework.assignedTo.some(student => student._id.toString() === req.user._id.toString());

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get user's submission if student
    let userSubmission = null;
    if (req.user.role === 'student') {
      userSubmission = await HomeworkSubmission.findOne({
        homework: homework._id,
        student: req.user._id
      }).populate('gradedBy', 'name');
    }

    res.json({
      homework,
      userSubmission
    });
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update homework (teachers only)
export const updateHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check permissions
    if (homework.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      description,
      instructions,
      subject,
      dueDate,
      maxPoints,
      allowedFileTypes,
      maxFileSize,
      maxFiles,
      allowLateSubmission,
      lateSubmissionPenalty,
      isActive
    } = req.body;

    // Update fields
    if (title !== undefined) homework.title = title;
    if (description !== undefined) homework.description = description;
    if (instructions !== undefined) homework.instructions = instructions;
    if (subject !== undefined) homework.subject = subject;
    if (dueDate !== undefined) homework.dueDate = new Date(dueDate);
    if (maxPoints !== undefined) homework.maxPoints = maxPoints;
    if (allowedFileTypes !== undefined) homework.allowedFileTypes = allowedFileTypes;
    if (maxFileSize !== undefined) homework.maxFileSize = maxFileSize;
    if (maxFiles !== undefined) homework.maxFiles = maxFiles;
    if (allowLateSubmission !== undefined) homework.allowLateSubmission = allowLateSubmission;
    if (lateSubmissionPenalty !== undefined) homework.lateSubmissionPenalty = lateSubmissionPenalty;
    if (isActive !== undefined) homework.isActive = isActive;

    await homework.save();
    await homework.populate('createdBy', 'name email');

    res.json({
      message: 'Homework updated successfully',
      homework
    });
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete homework (teachers only)
export const deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check permissions
    if (homework.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all submissions and their attachments
    const submissions = await HomeworkSubmission.find({ homework: homework._id });
    for (const submission of submissions) {
      // Delete submission attachments
      const attachments = await Attachment.find({
        relatedModel: 'HomeworkSubmission',
        relatedId: submission._id
      });
      
      for (const attachment of attachments) {
        // Delete file from filesystem
        if (fs.existsSync(attachment.path)) {
          await fs.promises.unlink(attachment.path);
        }
        await attachment.deleteOne();
      }
      
      await submission.deleteOne();
    }

    await homework.deleteOne();

    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign students to homework
export const assignStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check permissions
    if (homework.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate students exist and are in the same department
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      department: homework.department
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'Some students not found or not in the same department' });
    }

    homework.assignedTo = [...new Set([...homework.assignedTo, ...studentIds])];
    await homework.save();

    res.json({
      message: `${students.length} students assigned to homework`,
      assignedCount: homework.assignedTo.length
    });
  } catch (error) {
    console.error('Assign students error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Submit homework (students only)
export const submitHomework = async (req, res) => {
  try {
    const { submissionText } = req.body;
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check if student can submit
    if (!homework.canSubmit(req.user._id)) {
      return res.status(403).json({ message: 'Cannot submit to this homework' });
    }

    // Check if already submitted
    const existingSubmission = await HomeworkSubmission.findOne({
      homework: homework._id,
      student: req.user._id
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'Already submitted to this homework' });
    }

    // Create submission
    const submission = new HomeworkSubmission({
      homework: homework._id,
      student: req.user._id,
      submissionText: submissionText || ''
    });

    await submission.save();
    await submission.populate('student', 'name schoolId');

    res.status(201).json({
      message: 'Homework submitted successfully',
      submission
    });
  } catch (error) {
    console.error('Submit homework error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get homework submissions (teachers only)
export const getHomeworkSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Check permissions
    if (homework.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submissions = await HomeworkSubmission.getHomeworkSubmissions(homework._id, { status });

    // Get attachments for each submission
    const submissionsWithAttachments = await Promise.all(
      submissions.map(async (submission) => {
        const attachments = await submission.getAttachments();
        return {
          ...submission.toObject(),
          attachments
        };
      })
    );

    res.json({
      submissions: submissionsWithAttachments,
      homework: {
        title: homework.title,
        totalSubmissions: homework.totalSubmissions,
        onTimeSubmissions: homework.onTimeSubmissions,
        lateSubmissions: homework.lateSubmissions
      }
    });
  } catch (error) {
    console.error('Get homework submissions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Grade submission (teachers only)
export const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback, allowResubmission, resubmissionDeadline } = req.body;
    const submission = await HomeworkSubmission.findById(req.params.submissionId)
      .populate('homework')
      .populate('student', 'name schoolId email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check permissions
    if (submission.homework.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update submission
    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    submission.allowResubmission = allowResubmission || false;
    
    if (resubmissionDeadline) {
      submission.resubmissionDeadline = new Date(resubmissionDeadline);
    }

    await submission.save();

    res.json({
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get student's submissions
export const getStudentSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const studentId = req.user.role === 'student' ? req.user._id : req.params.studentId;

    // Check permissions for viewing other student's submissions
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submissions = await HomeworkSubmission.getStudentSubmissions(studentId, { status });

    // Get attachments for each submission
    const submissionsWithAttachments = await Promise.all(
      submissions.map(async (submission) => {
        const attachments = await submission.getAttachments();
        return {
          ...submission.toObject(),
          attachments
        };
      })
    );

    res.json({
      submissions: submissionsWithAttachments
    });
  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({ message: error.message });
  }
};
