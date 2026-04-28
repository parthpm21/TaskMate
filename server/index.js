import 'dotenv/config';  // Must be FIRST — loads .env before any other module's top-level code
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import bidRoutes from './routes/bids.js';
import chatRoutes from './routes/chats.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import userRoutes from './routes/users.js';
import { setupSocket } from './socket.js';
import { startTaskExpiryJob } from './jobs/taskExpiry.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

import { clerkMiddleware } from '@clerk/express';
app.use(clerkMiddleware({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
}));

// Attach io to req so routes can emit events
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Socket.io setup
setupSocket(io);

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
const maskedUri = mongoUri?.replace(/:([^@]+)@/, ':***@') || 'NOT SET';
console.log(`🔗 Connecting to MongoDB: ${maskedUri}`);

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,  // fail fast if DB unreachable
    socketTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // Start background job: auto-delete expired tasks every hour
    startTaskExpiryJob(io);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('   Check your MONGO_URI in server/.env');
    console.error('   For deployed apps, use a MongoDB Atlas URI (mongodb+srv://...)');
    process.exit(1);
  });
