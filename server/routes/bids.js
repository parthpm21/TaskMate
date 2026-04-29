import express from 'express';
import Bid from '../models/Bid.js';
import Task from '../models/Task.js';
import Chat from '../models/Chat.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/bids/task/:taskId — get all bids for a task (poster only)
router.get('/task/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the poster can see bids' });

    const bids = await Bid.find({ task: req.params.taskId })
      .sort({ createdAt: -1 })
      .populate('bidder', 'name avatar rating totalReviews tasksDone');
    res.json({ bids });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bids/my/:taskId — get the current user's own bid for a specific task
router.get('/my/:taskId', protect, async (req, res) => {
  try {
    const bid = await Bid.findOne({ task: req.params.taskId, bidder: req.user._id })
      .populate('bidder', 'name avatar rating');
    if (!bid) return res.status(404).json({ message: 'No bid found' });
    res.json({ bid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bids — place a bid
router.post('/', protect, async (req, res) => {
  try {
    const { taskId, amount, message, deliveryTime } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.status !== 'open') return res.status(400).json({ message: 'Task is no longer open' });
    if (task.poster.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot bid on your own task' });

    const existing = await Bid.findOne({ task: taskId, bidder: req.user._id });
    if (existing) return res.status(400).json({ message: 'You already placed a bid on this task' });

    const bid = await Bid.create({
      task: taskId, bidder: req.user._id, amount, message, deliveryTime,
    });
    await bid.populate('bidder', 'name avatar rating totalReviews tasksDone');

    // Increment bidsCount on task
    task.bidsCount += 1;
    await task.save();

    // Notify poster via socket
    req.io.to(`task:${taskId}`).emit('bid:new', { bid });

    res.status(201).json({ bid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bids/:id/accept — poster accepts a bid
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('bidder', 'name avatar');
    if (!bid) return res.status(404).json({ message: 'Bid not found' });

    const task = await Task.findById(bid.task);
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only poster can accept bids' });
    if (task.status !== 'open')
      return res.status(400).json({ message: 'Task is no longer open' });

    // Accept this bid, reject all others
    await Bid.updateMany({ task: task._id, _id: { $ne: bid._id } }, { status: 'rejected' });
    bid.status = 'accepted';
    await bid.save();

    // Update task
    task.status = 'assigned';
    task.assignedTo = bid.bidder._id;
    task.finalAmount = bid.amount;
    await task.save();

    // Create chat room if not exists
    const existingChat = await Chat.findOne({ task: task._id });
    if (!existingChat) {
      await Chat.create({
        task: task._id,
        participants: [task.poster, bid.bidder._id],
        messages: [{
          sender: task.poster,
          text: `Task assigned to ${bid.bidder.name}. Chat is now open!`,
          type: 'system',
        }],
        lastMessage: 'Task assigned.',
        lastActivity: new Date(),
      });
    }

    // Notify via socket
    req.io.to(`task:${task._id}`).emit('task:updated', {
      taskId: task._id, status: 'assigned', assignedTo: bid.bidder, finalAmount: bid.amount
    });

    res.json({ bid, task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bids/start-by-task/:taskId — tasker starts the task they were assigned to
router.put('/start-by-task/:taskId', protect, async (req, res) => {
  try {
    // Find the accepted bid for this task belonging to the requesting user
    const bid = await Bid.findOne({
      task: req.params.taskId,
      bidder: req.user._id,
      status: 'accepted',
    });
    if (!bid) return res.status(404).json({ message: 'No accepted bid found for this task' });

    const task = await Task.findById(bid.task);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.assignedTo?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (task.status !== 'assigned')
      return res.status(400).json({ message: 'Task must be in assigned state to start' });

    task.status = 'in_progress';
    await task.save();

    req.io.to(`task:${task._id}`).emit('task:updated', { taskId: task._id, status: 'in_progress' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bids/:id/start — tasker marks task as in progress (by bid ID)
router.put('/:id/start', protect, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ message: 'Bid not found' });
    if (bid.bidder.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });

    const task = await Task.findById(bid.task);
    if (task.status !== 'assigned')
      return res.status(400).json({ message: 'Task must be in assigned state' });

    task.status = 'in_progress';
    await task.save();

    req.io.to(`task:${task._id}`).emit('task:updated', { taskId: task._id, status: 'in_progress' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
