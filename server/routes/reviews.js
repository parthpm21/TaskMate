import express from 'express';
import Review from '../models/Review.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { taskId, revieweeId, rating, comment, role } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'completed')
      return res.status(400).json({ message: 'Can only review completed tasks' });

    const existing = await Review.findOne({ task: taskId, reviewer: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already reviewed this task' });

    const review = await Review.create({
      task: taskId, reviewer: req.user._id, reviewee: revieweeId,
      rating, comment, role,
    });

    // Update reviewee's average rating
    const reviews = await Review.find({ reviewee: revieweeId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(avg * 10) / 10,
      totalReviews: reviews.length,
    });

    await review.populate('reviewer', 'name avatar');
    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('reviewer', 'name avatar')
      .populate('task', 'title');
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
