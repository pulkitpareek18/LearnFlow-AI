import mongoose, { Schema, Model } from 'mongoose';
import { IReviewItem } from '@/types';

const ReviewItemSchema = new Schema<IReviewItem>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
    },
    conceptKey: {
      type: String,
      required: [true, 'Concept key is required'],
      trim: true,
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
    },
    // SM-2 Algorithm fields
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    repetitions: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextReviewDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    lastReviewDate: {
      type: Date,
    },
    // Performance tracking
    correctCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ReviewItemSchema.index({ studentId: 1, nextReviewDate: 1 });
ReviewItemSchema.index({ studentId: 1, courseId: 1 });
ReviewItemSchema.index({ studentId: 1, conceptKey: 1 });

// Prevent duplicate review items for the same student, module, and concept
ReviewItemSchema.index(
  { studentId: 1, moduleId: 1, conceptKey: 1 },
  { unique: true }
);

const ReviewItem: Model<IReviewItem> =
  mongoose.models.ReviewItem || mongoose.model<IReviewItem>('ReviewItem', ReviewItemSchema);

export default ReviewItem;
