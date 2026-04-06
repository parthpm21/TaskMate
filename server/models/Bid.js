import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    message: { type: String, required: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    deliveryTime: { type: String, default: '' }, // e.g. "2 hours"
  },
  { timestamps: true }
);

bidSchema.index({ task: 1 });
bidSchema.index({ bidder: 1 });

export default mongoose.model('Bid', bidSchema);
