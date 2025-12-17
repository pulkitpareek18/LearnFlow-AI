import mongoose, { Schema, Model } from 'mongoose';
import { IStudyPlan, StudyGoal, DailyStudyBlock } from '@/types/ai-features';

const StudyGoalSchema = new Schema<StudyGoal>(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    targetDate: { type: Date, required: true },
    moduleIds: [{ type: String }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const DailyStudyBlockSchema = new Schema<DailyStudyBlock>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    focus: {
      type: String,
      enum: ['new_content', 'review', 'practice'],
      required: true,
    },
    recommendedModules: [{ type: String }],
  },
  { _id: false }
);

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
    },
    goals: {
      type: [StudyGoalSchema],
      default: [],
    },
    dailySchedule: {
      type: [DailyStudyBlockSchema],
      default: [],
    },
    adaptations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
StudyPlanSchema.index({ studentId: 1, courseId: 1 });
StudyPlanSchema.index({ validUntil: 1 });

const StudyPlan: Model<IStudyPlan> =
  mongoose.models.StudyPlan || mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);

export default StudyPlan;
