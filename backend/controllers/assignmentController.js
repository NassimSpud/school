// controllers/assignmentController.js
import User from '../models/userModel.js';
import { protect, teacher, admin } from '../middleware/authMiddleware.js';

// Assign student to teacher (admin or teacher can do this)
export const assignStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can have students assigned' });
    }

    // Check if already assigned
    if (student.teacher && student.teacher.toString() === teacher._id.toString()) {
      return res.status(400).json({ message: 'Student already assigned to this teacher' });
    }

    // Remove from previous teacher if any
    if (student.teacher) {
      const prevTeacher = await User.findById(student.teacher);
      prevTeacher.students.pull(student._id);
      await prevTeacher.save();
    }

    // Update student's teacher
    student.teacher = teacher._id;
    await student.save();

    // Add to teacher's students list if not already there
    if (!teacher.students.includes(student._id)) {
      teacher.students.push(student._id);
      await teacher.save();
    }

    res.json({ message: 'Student assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher's students
export const getTeacherStudents = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).populate('students', 'name email schoolId');
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can view their students' });
    }

    res.json(teacher.students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's teacher
export const getStudentTeacher = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate('teacher', 'name email');
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view their teacher' });
    }

    res.json(student.teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};