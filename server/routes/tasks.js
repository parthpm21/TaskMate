import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Bid from '../models/Bid.js';
import Chat from '../models/Chat.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tasks — browse feed with filters
router.get('/', async (req, res) => {
  try {
    const {
      category, status = 'open', minBudget, maxBudget,
      search, sort = 'newest', page = 1, limit = 12,
      lat, lng, radius = 20,
    } = req.query;

    const filter = { status };
    if (category && category !== 'all') filter.category = category;
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (lat && lng) {
      filter['location.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000,
        },
      };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      budget_high: { budget: -1 },
      budget_low: { budget: 1 },
      deadline: { deadline: 1 },
    };

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sortMap[sort] || sortMap.newest)
        .skip(skip)
        .limit(Number(limit))
        .populate('poster', 'name avatar rating totalReviews'),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/my/posted — must be BEFORE /:id
router.get('/my/posted', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ poster: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name avatar rating');
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/my/accepted — must be BEFORE /:id
router.get('/my/accepted', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .sort({ createdAt: -1 })
      .populate('poster', 'name avatar rating');
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('poster', 'name avatar rating totalReviews tasksPosted')
      .populate('assignedTo', 'name avatar rating totalReviews tasksDone');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('description').trim().notEmpty(),
    body('category').notEmpty(),
    body('budget').isNumeric().withMessage('Budget must be a number'),
    body('deadline').isISO8601().withMessage('Valid deadline required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const task = await Task.create({ ...req.body, poster: req.user._id });
      await task.populate('poster', 'name avatar rating totalReviews');
      req.user.tasksPosted += 1;
      await req.user.save();
      res.status(201).json({ task });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/tasks/:id — edit task (poster only, when open)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (task.status !== 'open')
      return res.status(400).json({ message: 'Cannot edit a task that is already assigned' });

    const allowed = ['title', 'description', 'budget', 'deadline', 'location', 'isUrgent', 'photos'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) task[field] = req.body[field]; });
    await task.save();
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — cancel task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (['assigned', 'in_progress', 'pending_review'].includes(task.status))
      return res.status(400).json({ message: 'Cannot delete an active task' });

    task.status = 'cancelled';
    await task.save();
    res.json({ message: 'Task cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id/submit — TASKER marks work as done → pending_review
router.put('/:id/submit', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the assigned tasker can submit work' });
    if (task.status !== 'in_progress')
      return res.status(400).json({ message: 'Task must be in progress to submit' });

    task.status = 'pending_review';
    await task.save();

    req.io.to(`task:${task._id}`).emit('task:updated', {
      taskId: task._id,
      status: 'pending_review',
    });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id/approve — POSTER approves work → completed + triggers payment release
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the poster can approve work' });
    if (task.status !== 'pending_review')
      return res.status(400).json({ message: 'Task must be in pending_review state' });

    task.status = 'completed';
    task.completedAt = new Date();

    // Auto-release escrow if payment was held
    if (task.paymentStatus === 'held') {
      task.paymentStatus = 'released';
      if (task.assignedTo) {
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(task.assignedTo, {
          $inc: { totalEarned: task.finalAmount, tasksDone: 1 },
        });
      }
    }

    await task.save();

    req.io.to(`task:${task._id}`).emit('task:updated', {
      taskId: task._id,
      status: 'completed',
      paymentStatus: task.paymentStatus,
    });
    req.io.to(`task:${task._id}`).emit('payment:released', { taskId: task._id });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id/complete — legacy endpoint (kept for backwards compat)
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isInvolved =
      task.poster.toString() === req.user._id.toString() ||
      task.assignedTo?.toString() === req.user._id.toString();
    if (!isInvolved) return res.status(403).json({ message: 'Not authorised' });
    if (!['in_progress', 'pending_review'].includes(task.status))
      return res.status(400).json({ message: 'Task must be in progress to complete' });

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    req.io.to(`task:${task._id}`).emit('task:updated', { taskId: task._id, status: 'completed' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/tasks/:id/dispute
router.put('/:id/dispute', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isInvolved =
      task.poster.toString() === req.user._id.toString() ||
      task.assignedTo?.toString() === req.user._id.toString();
    if (!isInvolved) return res.status(403).json({ message: 'Not authorised' });

    task.status = 'disputed';
    await task.save();
    req.io.to(`task:${task._id}`).emit('task:updated', { taskId: task._id, status: 'disputed' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
