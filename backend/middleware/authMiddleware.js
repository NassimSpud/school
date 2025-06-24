import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Admin middleware
export const admin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Teacher middleware
export const teacher = (req, res, next) => {
  if (req.user?.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as teacher' });
  }
};

// Student middleware
export const student = (req, res, next) => {
  if (req.user?.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as student' });
  }
};