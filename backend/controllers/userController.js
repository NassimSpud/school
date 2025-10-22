import User from '../models/userModel.js';
import Report from '../models/reportModel.js';
import jwt from 'jsonwebtoken';
import { protect, admin } from '../middleware/authMiddleware.js';

// Reuse your existing token generation
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Admin Login (can be more strict than regular login)
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: 'admin' });

    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID (admin or own profile)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow access if admin or requesting their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user (admin or own profile)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Authorization check
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Prevent role change for non-admins
    if (req.user.role !== 'admin' && req.body.role) {
      return res.status(403).json({ message: 'Only admins can change roles' });
    }

    // Update fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.schoolId = req.body.schoolId || user.schoolId;
    if (req.body.password) {
      user.password = req.body.password;
    }
    if (req.user.role === 'admin' && req.body.role) {
      user.role = req.body.role;
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      schoolId: updatedUser.schoolId,
      role: updatedUser.role
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    // Prevent self-deletion (optional)
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const totalStudents = await User.countDocuments({ teacher: teacherId });
    const pendingEvaluations = await Report.countDocuments({ teacher: teacherId, status: 'submitted' });
    const recentStudents = await User.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name company location status');

    // This is a placeholder. You might need a more complex query to get this data.
    const nairobiStudents = await User.countDocuments({ teacher: teacherId, location: 'Nairobi' });
    const urgentIssues = 0; // Placeholder
    const upcomingVisits = []; // Placeholder for upcoming visits

    res.json({
      totalStudents,
      nairobiStudents,
      pendingEvaluations,
      urgentIssues,
      recentStudents,
      upcomingVisits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign teacher to student (admin only)
export const assignTeacher = async (req, res) => {
  const { teacherId } = req.body;
  const { studentId } = req.params;

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.teacher = teacherId;
    await student.save();

    res.json({ success: true, message: 'Teacher assigned successfully', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Keep your existing login/register functions
export { loginUser, registerUser } from './authController.js';

export const assignTeacherToStudent = async (req, res) => {
  const { teacherId } = req.body;
  const { studentId } = req.params;

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.teacher = teacherId;
    await student.save();

    res.json({ success: true, message: 'Teacher assigned successfully', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
