import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Returns a Razorpay instance for real mode, or null for mock mode
const MOCK_VALUES = new Set(['skip', 'your_key_id', 'your_key_secret', '']);

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || MOCK_VALUES.has(keyId) || MOCK_VALUES.has(keySecret)) {
    return null; // mock mode
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// POST /api/payments/create-order — poster pays into escrow
router.post('/create-order', protect, async (req, res) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only poster can pay' });
    if (task.status !== 'assigned')
      return res.status(400).json({ message: 'Task must be assigned before payment' });

    // Duplicate payment guard
    if (task.paymentStatus === 'held' || task.paymentStatus === 'released') {
      return res.status(400).json({ message: 'Payment already processed for this task' });
    }

    const razorpay = getRazorpay();

    // Mock payment flow bypass
    if (!razorpay) {
      task.razorpayOrderId = 'mock_order_' + Date.now();
      task.paymentStatus = 'held';
      await task.save();
      return res.json({
        orderId: task.razorpayOrderId,
        amount: Math.round(task.finalAmount * 100),
        currency: 'INR',
        key: 'skip',
      });
    }

    // Real Razorpay mode
    const order = await razorpay.orders.create({
      amount: Math.round(task.finalAmount * 100), // paise
      currency: 'INR',
      receipt: `task_${taskId}`,
      notes: { taskId: taskId.toString() },
    });

    task.razorpayOrderId = order.id;
    // DO NOT set paymentStatus here — wait for /verify to confirm payment
    await task.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/verify — verify payment signature
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, taskId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ message: 'Invalid payment signature' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only set to held after verified signature
    task.paymentStatus = 'held';
    task.razorpayPaymentId = razorpay_payment_id;
    await task.save();

    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/release — release escrow to tasker (poster triggers)
router.post('/release', protect, async (req, res) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.poster.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only poster can release payment' });
    if (task.status !== 'completed')
      return res.status(400).json({ message: 'Task must be completed first' });
    if (task.paymentStatus === 'released')
      return res.status(400).json({ message: 'Payment already released' });

    task.paymentStatus = 'released';
    await task.save();

    // Update tasker's earnings
    if (task.assignedTo) {
      await User.findByIdAndUpdate(task.assignedTo, {
        $inc: { totalEarned: task.finalAmount, tasksDone: 1 },
      });
    }

    req.io.to(`task:${task._id}`).emit('payment:released', { taskId: task._id });
    res.json({ message: 'Payment released to tasker', task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

