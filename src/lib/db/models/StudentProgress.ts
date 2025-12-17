import mongoose, { Schema, Model } from 'mongoose';
import {
  IStudentProgress,
  AssessmentScore,
  AIInsights,
  InteractionResponse,
  ModuleInteractionProgress,
  StudentGamification,
} from '@/types';

const AssessmentScoreSchema = new Schema<AssessmentScore>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    attempts: {
      type: Number,
      min: 1,
      default: 1,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Interaction Response Schema (student's answer to a content block interaction)
const InteractionResponseSchema = new Schema<InteractionResponse>(
  {
    blockId: { type: String, required: true },
    interactionType: {
      type: String,
      enum: ['mcq', 'fill_blank', 'reflection', 'reveal', 'confirm'],
      required: true,
    },
    response: { type: Schema.Types.Mixed, required: true }, // Flexible response object
    isCorrect: { type: Boolean },
    score: { type: Number },
    maxScore: { type: Number, required: true },
    timeSpent: { type: Number, default: 0 }, // in seconds
    attempts: { type: Number, default: 1 },
    aiFeedback: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Module Interaction Progress Schema
const ModuleInteractionProgressSchema = new Schema<ModuleInteractionProgress>(
  {
    moduleId: { type: String, required: true },
    responses: [InteractionResponseSchema],
    totalScore: { type: Number, default: 0 },
    maxPossibleScore: { type: Number, default: 0 },
    percentageComplete: { type: Number, default: 0 },
    adaptiveDifficultyAdjustment: { type: Number, default: 0, min: -5, max: 5 },
    completedAt: { type: Date },
  },
  { _id: false }
);

// Extended Learning Metrics Schema (includes both base and extended fields)
const LearningMetricsSchema = new Schema(
  {
    averageTimePerModule: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    streakDays: {
      type: Number,
      default: 0,
    },
    totalTimeSpent: {
      type: Number,
      default: 0, // in minutes
    },
    adaptiveDifficulty: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    // Extended metrics for adaptive learning
    interactionScore: {
      type: Number,
      default: 0, // 0-100
    },
    interactionAccuracy: {
      type: Number,
      default: 0, // 0-100 percentage
    },
    conceptsMastered: [{ type: String }],
    conceptsStruggling: [{ type: String }],
    recentTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable',
    },
    correctStreak: {
      type: Number,
      default: 0,
    },
    incorrectStreak: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const AIInsightsSchema = new Schema<AIInsights>(
  {
    strengths: [{ type: String }],
    areasToImprove: [{ type: String }],
    recommendedPace: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Gamification Schema
const GamificationSchema = new Schema<StudentGamification>(
  {
    totalXP: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: Date.now,
    },
    badges: [{
      type: String,
    }],
    dailyChallengeCompleted: {
      type: Boolean,
      default: false,
    },
    weeklyGoal: {
      target: {
        type: Number,
        default: 10,
      },
      current: {
        type: Number,
        default: 0,
      },
      type: {
        type: String,
        enum: ['modules', 'xp', 'minutes'],
        default: 'modules',
      },
    },
  },
  { _id: false }
);

const StudentProgressSchema = new Schema<IStudentProgress>(
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
    currentChapter: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    currentModule: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
    },
    completedModules: [{
      type: Schema.Types.ObjectId,
      ref: 'Module',
    }],
    completedChapters: [{
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    }],
    assessmentScores: [AssessmentScoreSchema],
    // New: Track interaction progress per module
    moduleInteractions: {
      type: [ModuleInteractionProgressSchema],
      default: [],
    },
    learningMetrics: {
      type: LearningMetricsSchema,
      default: () => ({}),
    },
    aiInsights: {
      type: AIInsightsSchema,
    },
    // Gamification data
    gamification: {
      type: GamificationSchema,
      default: () => ({}),
    },
    // Last accessed timestamp for tracking
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
StudentProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
StudentProgressSchema.index({ studentId: 1 });
StudentProgressSchema.index({ courseId: 1 });

const StudentProgress: Model<IStudentProgress> =
  mongoose.models.StudentProgress || mongoose.model<IStudentProgress>('StudentProgress', StudentProgressSchema);

export default StudentProgress;
