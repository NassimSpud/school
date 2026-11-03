import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  schoolId: user.schoolId,
  role: user.role,
  department: user.department
});

export const loginUser = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const schoolId = typeof req.body.schoolId === 'string' ? req.body.schoolId.trim().toUpperCase() : '';
  const { password } = req.body;

  if ((!email && !schoolId) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Email or school ID and password are required' });
  }

  try {
    const user = await User.findOne(email ? { email } : { schoolId }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      ...publicUser(user),
      token: createToken(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

export const registerUser = async (req, res) => {
  const { name, password } = req.body;
  const role = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const schoolId = typeof req.body.schoolId === 'string' ? req.body.schoolId.trim().toUpperCase() : '';
  const department = typeof req.body.department === 'string' ? req.body.department.trim().toUpperCase() : '';

  if (typeof name !== 'string' || !name.trim() || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Name and a password of at least 6 characters are required' });
  }

  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be student, teacher, or admin' });
  }

  if (role === 'admin' && process.env.ALLOW_ADMIN_REGISTRATION !== 'true') {
    return res.status(403).json({ message: 'Admin accounts must be created by an administrator' });
  }

  if (role === 'student' && !schoolId) {
    return res.status(400).json({ message: 'School ID is required for students' });
  }

  if (role !== 'student' && !email) {
    return res.status(400).json({ message: 'Email is required for teachers and admins' });
  }

  if (role !== 'admin' && !department) {
    return res.status(400).json({ message: 'Department is required' });
  }

  try {
    const identifierQuery = role === 'student' ? { schoolId } : { email };
    if (await User.exists(identifierQuery)) {
      return res.status(409).json({
        message: role === 'student'
          ? 'Student with this School ID already exists'
          : 'User with this email already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: role === 'student' ? undefined : email,
      schoolId: role === 'student' ? schoolId : undefined,
      password,
      role,
      department: role === 'admin' ? undefined : department
    });

    return res.status(201).json({
      ...publicUser(user),
      token: createToken(user)
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(error.errors).map(({ message }) => message).join(', ')
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with that email or school ID already exists' });
    }

    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};
