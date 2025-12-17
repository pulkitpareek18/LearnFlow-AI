import mongoose, { Schema, Model } from 'mongoose';
import { IUser, LearningProfile, LearningPreferences, AccessibilitySettings } from '@/types';

const LearningPreferencesSchema = new Schema<LearningPreferences>(
  {
    // Core learning style
    preferredPace: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium',
    },
    learningStyle: {
      type: String,
      enum: ['visual', 'reading', 'interactive'],
      default: 'reading',
    },
    contentDepth: {
      type: String,
      enum: ['concise', 'detailed', 'comprehensive'],
      default: 'detailed',
    },
    // Content preferences
    preferExamples: {
      type: String,
      enum: ['minimal', 'moderate', 'extensive'],
      default: 'moderate',
    },
    preferAnalogies: { type: Boolean, default: true },
    preferVisualAids: { type: Boolean, default: true },
    preferSummaries: { type: Boolean, default: true },
    // Interaction preferences
    interactionFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    feedbackStyle: {
      type: String,
      enum: ['encouraging', 'direct', 'detailed'],
      default: 'encouraging',
    },
    showHintsFirst: { type: Boolean, default: false },
    // Challenge preferences
    challengeLevel: {
      type: String,
      enum: ['comfortable', 'moderate', 'challenging'],
      default: 'moderate',
    },
    skipMasteredContent: { type: Boolean, default: false },
  },
  { _id: false }
);

const LearningProfileSchema = new Schema<LearningProfile>(
  {
    preferredPace: {
      type: String,
      enum: ['slow', 'medium', 'fast'],
      default: 'medium',
    },
    learningStyle: {
      type: String,
      enum: ['visual', 'reading', 'interactive'],
      default: 'reading',
    },
    difficultyLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    preferences: {
      type: LearningPreferencesSchema,
      default: () => ({}),
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const AccessibilitySettingsSchema = new Schema<AccessibilitySettings>(
  {
    // Visual
    highContrast: { type: Boolean, default: false },
    colorBlindMode: {
      type: String,
      enum: ['none', 'protanopia', 'deuteranopia', 'tritanopia'],
      default: 'none',
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra-large'],
      default: 'medium',
    },
    lineSpacing: {
      type: String,
      enum: ['normal', 'relaxed', 'loose'],
      default: 'normal',
    },
    fontFamily: {
      type: String,
      enum: ['default', 'dyslexia-friendly', 'monospace'],
      default: 'default',
    },
    // Motion
    reduceMotion: { type: Boolean, default: false },
    // Audio
    screenReaderOptimized: { type: Boolean, default: false },
    autoplayMedia: { type: Boolean, default: true },
    // Interaction
    keyboardOnly: { type: Boolean, default: false },
    extendedTimeForInteractions: { type: Boolean, default: false },
    timeMultiplier: { type: Number, default: 1, min: 1, max: 3 },
    // Focus
    focusIndicatorStyle: {
      type: String,
      enum: ['default', 'high-visibility'],
      default: 'default',
    },
    // Content
    simplifiedLanguage: { type: Boolean, default: false },
    showCaptions: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['teacher', 'student'],
      required: [true, 'Role is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      default: '',
    },
    learningProfile: {
      type: LearningProfileSchema,
      default: () => ({}),
    },
    accessibilitySettings: {
      type: AccessibilitySettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries (email index is already created by unique: true)
UserSchema.index({ role: 1 });

// Prevent model recompilation in development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
