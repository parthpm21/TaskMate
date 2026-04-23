import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/auth/me
 *
 * Returns the current user's MongoDB profile.
 * The `protect` middleware handles token verification + lazy user creation,
 * so by the time we get here, req.user is always populated.
 */
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;
