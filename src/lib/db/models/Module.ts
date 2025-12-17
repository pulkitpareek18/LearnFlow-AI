import mongoose, { Schema, Model } from 'mongoose';
import { IModule, AIGeneratedContent, PracticeQuestion, ContentBlock } from '@/types';

const PracticeQuestionSchema = new Schema<PracticeQuestion>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const AIGeneratedContentSchema = new Schema<AIGeneratedContent>(
  {
    summary: { type: String, default: '' },
    keyPoints: [{ type: String }],
    examples: [{ type: String }],
    practiceQuestions: [PracticeQuestionSchema],
  },
  { _id: false }
);

// MCQ Option Schema
const MCQOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    feedback: { type: String },
  },
  { _id: false }
);

// Blank Field Schema (for fill-in-the-blank)
const BlankFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    acceptableAnswers: [{ type: String }],
    hint: { type: String },
  },
  { _id: false }
);

// Test Case Schema for code interactions
const TestCaseSchema = new Schema(
  {
    id: { type: String, required: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    description: { type: String },
  },
  { _id: false }
);

// Content Interaction Schema (polymorphic - different fields for different types)
const ContentInteractionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'fill_blank', 'reflection', 'reveal', 'confirm', 'code'],
      required: true,
    },
    // MCQ fields
    question: { type: String },
    options: [MCQOptionSchema],
    explanation: { type: String },
    // Fill Blank fields
    text: { type: String }, // Text with {{blank_id}} placeholders
    blanks: [BlankFieldSchema],
    // Reflection fields
    prompt: { type: String },
    rubric: { type: String },
    minWords: { type: Number },
    maxWords: { type: Number },
    // Reveal fields
    buttonText: { type: String },
    revealedContent: { type: String },
    // Confirm fields
    statement: { type: String },
    confirmOptions: [
      {
        text: { type: String },
        value: { type: String, enum: ['fully', 'partially', 'not_yet'] },
      },
    ],
    // Code interaction fields
    language: {
      type: String,
      enum: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'html', 'css', 'sql'],
    },
    starterCode: { type: String },
    solutionCode: { type: String },
    testCases: [TestCaseSchema],
    hints: [{ type: String }],
    timeLimit: { type: Number, default: 5 }, // seconds
    memoryLimit: { type: Number, default: 128 }, // MB
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    conceptsAssessed: [{ type: String }],
    // Common field for graded interactions
    points: { type: Number, default: 0 },
  },
  { _id: false }
);

// Content Block Schema
const ContentBlockSchema = new Schema<ContentBlock>(
  {
    id: { type: String, required: true },
    order: { type: Number, required: true },
    type: {
      type: String,
      enum: ['text', 'interaction'],
      required: true,
    },
    content: { type: String }, // For text blocks
    interaction: ContentInteractionSchema, // For interaction blocks
    conceptKey: { type: String }, // Links to learning concept
    isRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

const ModuleSchema = new Schema<IModule>(
  {
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    // Legacy content field (kept for backward compatibility)
    content: {
      type: String,
      required: [true, 'Module content is required'],
    },
    // New interactive content blocks
    contentBlocks: {
      type: [ContentBlockSchema],
      default: [],
    },
    // Flag to indicate if module uses new interactive format
    isInteractive: {
      type: Boolean,
      default: false,
    },
    contentType: {
      type: String,
      enum: ['lesson', 'interactive', 'quiz'],
      default: 'lesson',
    },
    aiGeneratedContent: {
      type: AIGeneratedContentSchema,
      default: () => ({}),
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [0, 'Order must be non-negative'],
    },
    estimatedTime: {
      type: Number,
      default: 15, // minutes
      min: [1, 'Estimated time must be at least 1 minute'],
    },
    // Difficulty level for adaptive learning (1-10)
    difficultyLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for faster queries
ModuleSchema.index({ chapterId: 1 });
ModuleSchema.index({ chapterId: 1, order: 1 });

const Module: Model<IModule> =
  mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);

export default Module;
