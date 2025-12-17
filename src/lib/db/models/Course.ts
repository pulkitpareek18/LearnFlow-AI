import mongoose, { Schema, Model } from 'mongoose';
import { ICourse, LearningOutcome, InteractiveSettings } from '@/types';

// Learning Outcome Schema
const LearningOutcomeSchema = new Schema<LearningOutcome>(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    aiSuggested: { type: Boolean, default: true },
    teacherApproved: { type: Boolean, default: false },
    order: { type: Number, required: true },
    relatedModules: [{ type: String }], // Module IDs
  },
  { _id: false }
);

// Interactive Settings Schema
const InteractiveSettingsSchema = new Schema<InteractiveSettings>(
  {
    interactionFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    adaptiveLearningEnabled: {
      type: Boolean,
      default: true,
    },
    gradingWeight: {
      interactions: { type: Number, default: 0.30, min: 0, max: 1 },
      assessments: { type: Number, default: 0.70, min: 0, max: 1 },
    },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    rawContent: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    enrolledStudents: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    chapters: [{
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    }],
    // New fields for adaptive learning
    learningOutcomes: {
      type: [LearningOutcomeSchema],
      default: [],
    },
    interactiveSettings: {
      type: InteractiveSettingsSchema,
      default: () => ({
        interactionFrequency: 'medium',
        adaptiveLearningEnabled: true,
        gradingWeight: {
          interactions: 0.30,
          assessments: 0.70,
        },
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
CourseSchema.index({ teacherId: 1 });
CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ title: 'text', description: 'text' });

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
