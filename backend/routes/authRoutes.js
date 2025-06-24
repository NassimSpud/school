import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import User from '../models/userModel.js'; // Adjust path if needed

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // or use schoolId if you prefer

  try {
    // Find user by email (or schoolId)
    const user = await User.findOne({ email }); // Change to { schoolId } if using schoolId

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Respond with user role and a fake token (replace with JWT in production)
    res.json({ role: user.role, token: 'fake-jwt-token' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;