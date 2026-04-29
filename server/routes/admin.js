import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Bid from '../models/Bid.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require auth + admin
router.use(protect, requireAdmin);

// GET /api/admin/stats — platform overview
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalTasks, openTasks, activeTasks,
      pendingReviewTasks, completedTasks, disputedTasks, totalBids,
    ] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'open' }),
      Task.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
      Task.countDocuments({ status: 'pending_review' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'disputed' }),
      Bid.countDocuments(),
    ]);

    // Total revenue (sum of finalAmount for completed+released tasks)
    const revenueAgg = await Task.aggregate([
      { $match: { status: 'completed', paymentStatus: 'released' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Escrow held
    const escrowAgg = await Task.aggregate([
      { $match: { paymentStatus: 'held' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]);
    const escrowHeld = escrowAgg[0]?.total || 0;

    res.json({
      totalUsers, totalTasks, openTasks, activeTasks,
      pendingReviewTasks, completedTasks, disputedTasks,
      totalBids, totalRevenue, escrowHeld,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/tasks — all tasks with filters
router.get('/tasks', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('poster', 'name email avatar')
        .populate('assignedTo', 'name email avatar'),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users — all users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/tasks/:id/resolve — force-resolve disputed task
router.put('/tasks/:id/resolve', async (req, res) => {
  try {
    const { action } = req.body; // 'release' or 'refund'
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (action === 'release') {
      task.status = 'completed';
      task.completedAt = new Date();
      if (task.paymentStatus === 'held') {
        task.paymentStatus = 'released';
        if (task.assignedTo) {
          await User.findByIdAndUpdate(task.assignedTo, {
            $inc: { totalEarned: task.finalAmount, tasksDone: 1 },
          });
        }
      }
    } else if (action === 'refund') {
      task.status = 'cancelled';
      if (task.paymentStatus === 'held') {
        task.paymentStatus = 'refunded';
      }
    } else {
      return res.status(400).json({ message: 'Action must be "release" or "refund"' });
    }

    await task.save();
    req.io.to(`task:${task._id}`).emit('task:updated', {
      taskId: task._id, status: task.status, paymentStatus: task.paymentStatus,
    });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/tasks/:id/cancel — cancel any task
router.put('/tasks/:id/cancel', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = 'cancelled';
    if (task.paymentStatus === 'held') {
      task.paymentStatus = 'refunded';
    }
    await task.save();

    req.io.to(`task:${task._id}`).emit('task:updated', {
      taskId: task._id, status: 'cancelled',
    });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/toggle-admin — grant/revoke admin
router.put('/users/:id/toggle-admin', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent removing your own admin
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own admin status' });
    }

    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id — delete user
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
