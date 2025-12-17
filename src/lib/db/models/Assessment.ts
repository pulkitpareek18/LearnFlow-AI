import mongoose, { Schema, Model } from 'mongoose';
import { IAssessment, Question } from '@/types';

const QuestionSchema = new Schema<Question>(
  {
    question: {
      type: String,
      required: [true, 'Question text is required'],
    },
    type: {
      type: String,
      enum: ['mcq', 'short', 'long', 'interactive'],
      required: [true, 'Question type is required'],
    },
    options: [{
      type: String,
    }],
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
    },
    explanation: {
      type: String,
      default: '',
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    points: {
      type: Number,
      min: 1,
      default: 10,
    },
  },
  { _id: true }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'final'],
      required: [true, 'Assessment type is required'],
    },
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: function(v: Question[]) {
          return v.length > 0;
        },
        message: 'Assessment must have at least one question',
      },
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 60,
    },
    timeLimit: {
      type: Number,
      min: 0,
      default: 30, // minutes, 0 means no limit
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for faster queries
AssessmentSchema.index({ courseId: 1 });
AssessmentSchema.index({ chapterId: 1 });
AssessmentSchema.index({ moduleId: 1 });

const Assessment: Model<IAssessment> =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);

export default Assessment;
