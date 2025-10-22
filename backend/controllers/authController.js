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
  const { name, email, schoolId, password, role, department } = req.body;

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

    // Department is required for all roles except admin
    if (role !== 'admin' && !department) {
      return res.status(400).json({ 
        message: 'Department is required' 
      });
    }

    // Validate department enum
    if (role !== 'admin' && department && !['IT', 'Engineering', 'Business', 'Science', 'Arts'].includes(department.toUpperCase())) {
      return res.status(400).json({ 
        message: 'Department must be one of: IT, Engineering, Business, Science, Arts' 
      });
    }

    // Validate schoolId format for students
    if (role === 'student' && schoolId && !/^[A-Z0-9]+$/.test(schoolId)) {
      return res.status(400).json({ 
        message: 'School ID must contain only uppercase letters and numbers (e.g., STU123, ABC456)' 
      });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
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
      schoolId: role === 'student' ? schoolId.toUpperCase() : undefined,
      password,
      role,
      department: role !== 'admin' ? department.toUpperCase() : undefined
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      schoolId: user.schoolId,
      role: user.role,
      department: user.department,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: messages.join(', ')
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        message: `${field === 'schoolId' ? 'School ID' : 'Email'} '${value}' is already registered`
      });
    }

    res.status(500).json({ 
      message: error.message || 'Server error during registration' 
    });
  }
};
