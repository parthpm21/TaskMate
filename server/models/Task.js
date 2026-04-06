import mongoose from 'mongoose';

const CATEGORIES = [
  'delivery', 'academic', 'tech', 'household',
  'tutoring', 'transport', 'events', 'personal', 'other',
];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    budget: { type: Number, required: true, min: 10 },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'completed', 'disputed', 'cancelled'],
      default: 'open',
    },
    poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deadline: { type: Date, required: true },
    location: {
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      isRemote: { type: Boolean, default: false },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    photos: [{ type: String }],
    isUrgent: { type: Boolean, default: false },
    bidsCount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: null },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'held', 'released', 'refunded'],
      default: 'unpaid',
    },
    razorpayOrderId: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ 'location.coordinates': '2dsphere' });
taskSchema.index({ status: 1, category: 1 });
taskSchema.index({ poster: 1 });
taskSchema.index({ assignedTo: 1 });

export default mongoose.model('Task', taskSchema);
