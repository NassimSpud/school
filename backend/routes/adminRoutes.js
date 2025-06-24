import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(admin);

// Admin routes
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

export default router;