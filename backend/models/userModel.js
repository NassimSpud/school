import bcrypt from 'bcryptjs';
import { supabase } from '../config/db.js';

const publicFields = 'id, name, email, school_id, role, department, teacher_id, profile_picture_id, created_at, updated_at';

const toUser = (row) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  email: row.email,
  schoolId: row.school_id,
  role: row.role,
  department: row.department,
  teacher: row.teacher_id,
  profilePicture: row.profile_picture_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select(publicFields)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return toUser(data);
};

export const findUserForLogin = async ({ email, schoolId }) => {
  const column = email ? 'email' : 'school_id';
  const identifier = email || schoolId;
  const { data, error } = await supabase
    .from('users')
    .select(`${publicFields}, password_hash`)
    .eq(column, identifier)
    .maybeSingle();

  if (error) throw error;
  return data && {
    ...toUser(data),
    password: data.password_hash
  };
};

export const createUser = async ({ name, email, schoolId, password, role, department }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({
      name,
      email,
      school_id: schoolId,
      password_hash: passwordHash,
      role,
      department
    })
    .select(publicFields)
    .single();

  if (error) throw error;
  return toUser(data);
};

export const clearUserProfilePicture = async (userId, attachmentId) => {
  const { error } = await supabase
    .from('users')
    .update({ profile_picture_id: null })
    .eq('id', userId)
    .eq('profile_picture_id', attachmentId);

  if (error) throw error;
};

export const matchPassword = (password, passwordHash) => (
  bcrypt.compare(password, passwordHash)
);
