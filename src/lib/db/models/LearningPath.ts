import mongoose, { Schema, Model } from 'mongoose';
import { ILearningPath, IStudentLearningPath, ConceptNode, PathBranch } from '@/types';

// Concept Node Schema
const ConceptNodeSchema = new Schema<ConceptNode>(
  {
    id: { type: String, required: true },
    conceptKey: { type: String, required: true },
    title: { type: String, required: true },
    moduleId: { type: String, required: true },
    prerequisites: [{ type: String }],
    difficulty: { type: Number, required: true, min: 1, max: 10 },
    estimatedTime: { type: Number, required: true }, // in minutes
  },
  { _id: false }
);

// Path Branch Schema
const PathBranchSchema = new Schema<PathBranch>(
  {
    id: { type: String, required: true },
    condition: {
      type: {
        type: String,
        enum: ['accuracy_below', 'accuracy_above', 'struggling_concept', 'mastered_concept'],
        required: true,
      },
      threshold: { type: Number },
      conceptKey: { type: String },
    },
    targetModuleId: { type: String, required: true },
    branchType: {
      type: String,
      enum: ['remedial', 'advanced', 'alternative'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

// Learning Path Schema (course-level path structure)
const LearningPathSchema = new Schema<ILearningPath>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      unique: true,
    },
    nodes: [ConceptNodeSchema],
    edges: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        _id: false,
      },
    ],
    branches: [PathBranchSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
LearningPathSchema.index({ courseId: 1 });

// Student Learning Path Schema (personalized path for each student)
const StudentLearningPathSchema = new Schema<IStudentLearningPath>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    currentNodeId: {
      type: String,
      required: true,
    },
    completedNodes: [{ type: String }],
    skippedNodes: [{ type: String }],
    branchHistory: [
      {
        branchId: { type: String, required: true },
        takenAt: { type: Date, default: Date.now },
        reason: { type: String, required: true },
        _id: false,
      },
    ],
    suggestedPath: [{ type: String }], // Ordered node IDs
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
StudentLearningPathSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
StudentLearningPathSchema.index({ studentId: 1 });
StudentLearningPathSchema.index({ courseId: 1 });

// Models
const LearningPath: Model<ILearningPath> =
  mongoose.models.LearningPath || mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);

const StudentLearningPath: Model<IStudentLearningPath> =
  mongoose.models.StudentLearningPath ||
  mongoose.model<IStudentLearningPath>('StudentLearningPath', StudentLearningPathSchema);

export { LearningPath, StudentLearningPath };
