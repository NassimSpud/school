import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserForLogin,
  matchPassword
} from '../models/userModel.js';
import { supabase } from '../config/db.js';
import {
  findCompanySupervisorByEmail,
  hasCurrentPlacement,
  markCompanySupervisorAccepted
} from '../models/companySupervisorModel.js';

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const publicUser = (user) => ({
  _id: user._id,
  id: user.id,
  name: user.name,
  email: user.email,
  schoolId: user.schoolId,
  role: user.role,
  department: user.department,
  companyId: user.companyId
});

export const loginUser = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const schoolId = typeof req.body.schoolId === 'string' ? req.body.schoolId.trim().toUpperCase() : '';
  const { password } = req.body;

  if ((!email && !schoolId) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Email or school ID and password are required' });
  }

  try {
    const user = await findUserForLogin({ email, schoolId });
    if (user) {
      if (!(await matchPassword(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return res.json({
        ...publicUser(user),
        token: createToken(user)
      });
    }

    if (!email) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const companySupervisor = await findCompanySupervisorByEmail(email);
    if (!companySupervisor?.user_id) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (authError || authData.user?.id !== companySupervisor.user_id) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!(await hasCurrentPlacement(companySupervisor.id))) {
      return res.status(403).json({ message: 'No active placement is currently assigned to this account' });
    }

    if (authData.user.email_confirmed_at && !companySupervisor.accepted_at) {
      await markCompanySupervisorAccepted(companySupervisor.id);
    }

    const supervisorUser = {
      _id: authData.user.id,
      id: authData.user.id,
      name: companySupervisor.name,
      email: companySupervisor.email,
      role: 'company_supervisor',
      companyId: companySupervisor.company_id
    };

    return res.json({
      ...publicUser(supervisorUser),
      token: createToken(supervisorUser)
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
    const user = await createUser({
      name: name.trim(),
      email: role === 'student' ? null : email,
      schoolId: role === 'student' ? schoolId : null,
      password,
      role,
      department: role === 'admin' ? null : department
    });

    return res.status(201).json({
      ...publicUser(user),
      token: createToken(user)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: role === 'student'
          ? 'Student with this School ID already exists'
          : 'User with this email already exists'
      });
    }

    if (error.code === '23514' || error.code === '23502' || error.code === '22001') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};
