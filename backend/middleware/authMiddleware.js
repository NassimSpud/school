import jwt from 'jsonwebtoken';
import { getUserById } from '../models/userModel.js';
import {
  findCompanySupervisorByUserId,
  hasCurrentPlacement
} from '../models/companySupervisorModel.js';

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  try {
    if (decoded.role === 'company_supervisor') {
      const supervisor = await findCompanySupervisorByUserId(decoded.id);
      if (!supervisor) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (!(await hasCurrentPlacement(supervisor.id))) {
        return res.status(403).json({ message: 'No active placement is currently assigned to this account' });
      }

      req.user = {
        _id: supervisor.user_id,
        id: supervisor.user_id,
        role: 'company_supervisor',
        name: supervisor.name,
        email: supervisor.email,
        companyId: supervisor.company_id,
        companySupervisorId: supervisor.id
      };
    } else {
      req.user = await getUserById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
    }

    return next();
  } catch (error) {
    console.error('Authentication lookup error:', error);
    return res.status(500).json({ message: 'Unable to verify user account' });
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