// backend/controllers/studentsController.js
import User from '../models/userModel.js';

// @desc    Assign supervisor to student(s)
// @route   POST /api/students/:studentId/assign-supervisor
// @access  Private (Admin only)
export const assignSupervisor = async (req, res) => {
  try {
    const { studentIds, teacherId } = req.body;
    const currentUser = await User.findById(req.user.id);

    // Validate input
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Get teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Get current user's department if they're an admin
    if (currentUser.role === 'admin' && currentUser.department) {
      // Verify teacher is in the same department
      if (teacher.department !== currentUser.department) {
        return res.status(403).json({ message: 'Cannot assign teacher from different department' });
      }
    }

    // If single student ID in params, use that
    const studentsToUpdate = studentIds ? studentIds : [req.params.studentId];

    // Update each student
    const updatedStudents = await Promise.all(
      studentsToUpdate.map(async (studentId) => {
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
          throw new Error(`Student ${studentId} not found`);
        }

        // Verify student is in the same department as teacher
        if (student.department !== teacher.department) {
          throw new Error(`Cannot assign teacher from different department to student ${studentId}`);
        }

        // Update student's supervisor
        student.teacher = teacherId;
        await student.save();

        // Add student to teacher's list
        if (!teacher.students.includes(studentId)) {
          teacher.students.push(studentId);
          await teacher.save();
        }

        return student;
      })
    );

    res.json(updatedStudents);
  } catch (error) {
    console.error('Error assigning supervisor:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin only)
export const getAllStudents = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    let query = { role: 'student' };
    
    // For students: can only see their own supervisor
    if (currentUser.role === 'student') {
      query._id = currentUser._id;
      return res.json([await User.findOne(query)
        .populate('teacher', 'name email department')
        .select('-password')]);
    }

    // For teachers: can see all their students
    if (currentUser.role === 'teacher') {
      const students = await User.find({
        role: 'student',
        teacher: currentUser._id
      })
      .populate('teacher', 'name email department')
      .select('-password');
      return res.json(students);
    }

    // For admins (HODs): can see students in their department
    if (currentUser.role === 'admin' && currentUser.department) {
      query.department = currentUser.department;
    }

    const students = await User.find(query)
      .populate('teacher', 'name email department')
      .select('-password');
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Admin only)
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .populate('teacher', 'name email department')
      .select('-password');

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const currentUser = await User.findById(req.user.id);

    // Students can only view their own data
    if (currentUser.role === 'student' && currentUser._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to view this student' });
    }

    // Teachers can only view their own students
    if (currentUser.role === 'teacher' && student.teacher?.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this student' });
    }

    // Admins (HODs) can only view students in their department
    if (currentUser.role === 'admin' && currentUser.department && student.department !== currentUser.department) {
      return res.status(403).json({ message: 'Not authorized to view this student' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin only)
export const updateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Only allow updates if the student is in the same department as the admin
    if (currentUser.role === 'admin' && student.department !== currentUser.department) {
      return res.status(403).json({ message: 'Not authorized to update this student' });
    }

    // Update student fields
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.remove();
    res.json({ message: 'Student removed' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
