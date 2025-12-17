import mongoose, { Schema, Model } from 'mongoose';
import { IChapter } from '@/types';

const ChapterSchema = new Schema<IChapter>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Chapter order is required'],
      min: [0, 'Order must be non-negative'],
    },
    modules: [{
      type: Schema.Types.ObjectId,
      ref: 'Module',
    }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for faster queries
ChapterSchema.index({ courseId: 1 });
ChapterSchema.index({ courseId: 1, order: 1 });

const Chapter: Model<IChapter> =
  mongoose.models.Chapter || mongoose.model<IChapter>('Chapter', ChapterSchema);

export default Chapter;
