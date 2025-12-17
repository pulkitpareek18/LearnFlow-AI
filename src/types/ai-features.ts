import { ObjectId } from 'mongoose';

// ==========================================
// AI-Powered Study Plan Types
// ==========================================

export interface StudyGoal {
  id: string;
  description: string;
  targetDate: Date;
  moduleIds: string[];
  progress: number;
  completed: boolean;
}

export interface DailyStudyBlock {
  day: number;
  startTime: string;
  duration: number;
  focus: 'new_content' | 'review' | 'practice';
  recommendedModules: string[];
}

export interface StudyPlan {
  id: string;
  studentId: string;
  courseId: string;
  createdAt: Date;
  validUntil: Date;
  goals: StudyGoal[];
  dailySchedule: DailyStudyBlock[];
  adaptations: string[];
}

export interface IStudyPlan {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  createdAt: Date;
  validUntil: Date;
  goals: StudyGoal[];
  dailySchedule: DailyStudyBlock[];
  adaptations: string[];
  updatedAt: Date;
}

// ==========================================
// AI-Powered Learning Assistance Types
// ==========================================

export interface ExplainDifferentlyRequest {
  content: string;
  conceptKey: string;
  currentUnderstanding: 'none' | 'partial' | 'confused';
  preferredStyle: 'analogy' | 'step_by_step' | 'visual' | 'example' | 'eli5';
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'short_answer' | 'true_false';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  conceptKey: string;
}
