import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const loginUser = async (req, res) => {
  const { email, schoolId, password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    // Find user by email or schoolId and include the password field
    const user = email 
      ? await User.findOne({ email }).select('+password')
      : await User.findOne({ schoolId }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create user object without password for response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({
      ...userWithoutPassword,
      token: generateToken(user._id, user.role)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, schoolId, password, role } = req.body;

  try {
    // Validate required fields based on role
    if (role === 'student' && !schoolId) {
      return res.status(400).json({ 
        message: 'School ID is required for students' 
      });
    }
    
    if (role !== 'student' && !email) {
      return res.status(400).json({ 
        message: 'Email is required for teachers/admins' 
      });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Check if user exists
    const existingUser = role === 'student'
      ? await User.findOne({ schoolId })
      : await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ 
        message: role === 'student'
          ? 'Student with this School ID already exists'
          : 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: role !== 'student' ? email : undefined,
      schoolId: role === 'student' ? schoolId : undefined,
      password,
      role
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      schoolId: user.schoolId,
      role: user.role,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error during registration' 
    });
  }
};