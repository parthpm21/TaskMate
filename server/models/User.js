import mongoose from 'mongoose';

const CATEGORIES = [
  'delivery', 'academic', 'tech', 'household',
  'tutoring', 'transport', 'events', 'personal', 'other',
];

const userSchema = new mongoose.Schema(
  {
    // Clerk user ID — set on first API call (lazy sync)
    clerkId: { type: String, unique: true, sparse: true },

    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    location: {
      city: { type: String, default: '' },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    tasksPosted: { type: Number, default: 0 },
    tasksDone: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    skills: [{ type: String }],
    badges: [{ type: String }],
  },
  { timestamps: true }
);



export default mongoose.model('User', userSchema);
