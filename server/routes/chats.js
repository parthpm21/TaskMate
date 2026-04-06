import express from 'express';
import Chat from '../models/Chat.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/chats/task/:taskId
router.get('/task/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isParticipant =
      task.poster.toString() === req.user._id.toString() ||
      task.assignedTo?.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ message: 'Not a participant' });

    const chat = await Chat.findOne({ task: req.params.taskId })
      .populate('messages.sender', 'name avatar');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    res.json({ chat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chats/task/:taskId/message
router.post('/task/:taskId/message', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const chat = await Chat.findOne({ task: req.params.taskId });
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isParticipant = chat.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Not a participant' });

    const message = {
      sender: req.user._id,
      text: text.trim(),
      type: 'text',
      readBy: [req.user._id],
    };

    chat.messages.push(message);
    chat.lastMessage = text.trim().slice(0, 80);
    chat.lastActivity = new Date();
    await chat.save();

    // Populate sender for response
    const savedMsg = chat.messages[chat.messages.length - 1];
    const populatedMsg = {
      ...savedMsg.toObject(),
      sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
    };

    // Emit via socket
    req.io.to(`task:${req.params.taskId}`).emit('chat:message', populatedMsg);

    res.status(201).json({ message: populatedMsg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chats/my — all chats for current user
router.get('/my', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .sort({ lastActivity: -1 })
      .populate('task', 'title status')
      .populate('participants', 'name avatar');
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
