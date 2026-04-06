import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    role: { type: String, enum: ['poster', 'tasker'], required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ task: 1 });

export default mongoose.model('Review', reviewSchema);
