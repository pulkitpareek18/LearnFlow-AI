import { ObjectId } from 'mongoose';

// User Types
export type UserRole = 'teacher' | 'student';
export type LearningPace = 'slow' | 'medium' | 'fast';
export type LearningStyle = 'visual' | 'reading' | 'interactive';
export type ContentDepth = 'concise' | 'detailed' | 'comprehensive';
export type ExamplePreference = 'minimal' | 'moderate' | 'extensive';
export type FeedbackStyle = 'encouraging' | 'direct' | 'detailed';

export interface LearningPreferences {
  // Core learning style
  preferredPace: LearningPace;
  learningStyle: LearningStyle;
  contentDepth: ContentDepth;

  // Content preferences
  preferExamples: ExamplePreference;
  preferAnalogies: boolean;
  preferVisualAids: boolean;
  preferSummaries: boolean;

  // Interaction preferences
  interactionFrequency: 'low' | 'medium' | 'high';
  feedbackStyle: FeedbackStyle;
  showHintsFirst: boolean;

  // Challenge preferences
  challengeLevel: 'comfortable' | 'moderate' | 'challenging';
  skipMasteredContent: boolean;
}

export interface LearningProfile {
  preferredPace: LearningPace;
  learningStyle: LearningStyle;
  difficultyLevel: number;
  strengths: string[];
  weaknesses: string[];
  preferences?: LearningPreferences;
  onboardingCompleted?: boolean;
}

export interface IUser {
  _id: ObjectId;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  avatar?: string;
  learningProfile?: LearningProfile;
  accessibilitySettings?: AccessibilitySettings;
  createdAt: Date;
  updatedAt: Date;
}

// Code Resource for course (GitHub repos or code files)
export interface CodeResource {
  id: string;
  type: 'github_repo' | 'github_file' | 'uploaded_file';
  url?: string; // GitHub URL
  fileName?: string;
  content?: string; // File content
  language: ProgrammingLanguage;
  description?: string;
  mappedModuleIds?: string[]; // Which modules this code relates to
}

// Teacher Instructions for AI course generation
export interface TeacherInstructions {
  generalInstructions?: string; // General guidance for course generation
  includeCodeQuestions?: boolean; // Whether to include coding exercises
  codeQuestionTypes?: ('implementation' | 'debugging' | 'completion' | 'review')[]; // Types of code questions
  preferredLanguages?: ProgrammingLanguage[]; // Programming languages to use
  difficultyDistribution?: {
    easy: number; // Percentage, e.g., 30
    medium: number; // e.g., 50
    hard: number; // e.g., 20
  };
  focusAreas?: string[]; // Specific topics to emphasize
  excludeTopics?: string[]; // Topics to avoid
  assessmentPreferences?: {
    includeQuizzes: boolean;
    includeCodingChallenges: boolean;
    includeReflections: boolean;
  };
}

// Course Types
export interface ICourse {
  _id: ObjectId;
  teacherId: ObjectId;
  title: string;
  description: string;
  thumbnail?: string;
  pdfUrl?: string;
  rawContent?: string;
  isPublished: boolean;
  enrolledStudents: ObjectId[];
  chapters: ObjectId[];
  learningOutcomes?: LearningOutcome[]; // AI-suggested, teacher-approved outcomes
  interactiveSettings?: InteractiveSettings; // Adaptive learning settings
  teacherInstructions?: TeacherInstructions; // Teacher's custom instructions for AI
  codeResources?: CodeResource[]; // GitHub repos and code files
  createdAt: Date;
  updatedAt: Date;
}

export interface IChapter {
  _id: ObjectId;
  courseId: ObjectId;
  title: string;
  order: number;
  modules: ObjectId[];
  createdAt: Date;
}

export type ModuleContentType = 'lesson' | 'interactive' | 'quiz';

export interface AIGeneratedContent {
  summary: string;
  keyPoints: string[];
  examples: string[];
  practiceQuestions: PracticeQuestion[];
}

export interface PracticeQuestion {
  question: string;
  answer: string;
  explanation?: string;
}

export interface IModule {
  _id: ObjectId;
  chapterId: ObjectId;
  title: string;
  content: string;
  contentBlocks?: ContentBlock[]; // New interactive content blocks
  isInteractive?: boolean; // Flag for new interactive format
  contentType: ModuleContentType;
  aiGeneratedContent?: AIGeneratedContent;
  order: number;
  estimatedTime: number;
  difficultyLevel?: number; // 1-10 for adaptive learning
  multiModalContent?: Array<{
    conceptKey: string;
    formats: {
      text?: string;
      visual?: {
        type: 'diagram' | 'flowchart' | 'mindmap' | 'infographic';
        description: string;
        svgContent?: string;
      };
      audioDescription?: string;
      interactive?: {
        type: string;
        config: Record<string, unknown>;
      };
    };
    preferredFor: string[];
  }>;
  createdAt: Date;
}

// Assessment Types
export type AssessmentType = 'quiz' | 'assignment' | 'final';
export type QuestionType = 'mcq' | 'short' | 'long' | 'interactive';

export interface Question {
  question: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: number;
  points: number;
}

export interface IAssessment {
  _id: ObjectId;
  moduleId?: ObjectId;
  chapterId?: ObjectId;
  courseId: ObjectId;
  type: AssessmentType;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  createdAt: Date;
}

// Progress Types
export interface AssessmentScore {
  assessmentId: ObjectId;
  score: number;
  attempts: number;
  completedAt: Date;
}

export interface LearningMetrics {
  averageTimePerModule: number;
  averageScore: number;
  streakDays: number;
  totalTimeSpent: number;
  adaptiveDifficulty: number;
}

export interface AIInsights {
  strengths: string[];
  areasToImprove: string[];
  recommendedPace: string;
  lastUpdated: Date;
}

export interface IStudentProgress {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  currentChapter?: ObjectId;
  currentModule?: ObjectId;
  completedModules: ObjectId[];
  completedChapters: ObjectId[];
  assessmentScores: AssessmentScore[];
  moduleInteractions?: ModuleInteractionProgress[]; // Track interaction progress per module
  learningMetrics: LearningMetrics | ExtendedLearningMetrics;
  aiInsights?: AIInsights;
  gamification?: StudentGamification;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Types
export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IAIConversation {
  _id: ObjectId;
  studentId: ObjectId;
  moduleId: ObjectId;
  messages: ChatMessage[];
  context: string;
  createdAt: Date;
}

// Enrollment Types
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface IEnrollment {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  enrolledAt: Date;
  status: EnrollmentStatus;
  completedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Session Types (NextAuth)
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string;
}

// ==========================================
// Interactive Learning Types
// ==========================================

// Interaction Types
export type InteractionType = 'mcq' | 'fill_blank' | 'reflection' | 'reveal' | 'confirm' | 'code';
export type ContentBlockType = 'text' | 'interaction';

// MCQ Interaction
export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface MCQInteraction {
  type: 'mcq';
  question: string;
  options: MCQOption[];
  explanation?: string;
  points: number;
}

// Fill in the Blank Interaction
export interface BlankField {
  id: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  hint?: string;
}

export interface FillBlankInteraction {
  type: 'fill_blank';
  text: string; // Text with {{blank_id}} placeholders
  blanks: BlankField[];
  points: number;
}

// Reflection Interaction (AI-graded open response)
export interface ReflectionInteraction {
  type: 'reflection';
  prompt: string;
  rubric: string;
  minWords?: number;
  maxWords?: number;
  points: number;
}

// Reveal Interaction (click to reveal extra info)
export interface RevealInteraction {
  type: 'reveal';
  buttonText: string;
  revealedContent: string;
}

// Confirm Understanding Interaction
export interface ConfirmInteraction {
  type: 'confirm';
  statement: string;
  options: Array<{
    text: string;
    value: 'fully' | 'partially' | 'not_yet';
  }>;
}

// Code Interaction (coding exercises)
export type ProgrammingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c' | 'go' | 'rust' | 'html' | 'css' | 'sql';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean; // Hidden test cases for evaluation
  description?: string;
}

export interface CodeInteraction {
  type: 'code';
  prompt: string; // The coding question/challenge
  language: ProgrammingLanguage;
  starterCode?: string; // Initial code template
  solutionCode?: string; // Reference solution for AI comparison
  testCases: TestCase[];
  hints?: string[];
  rubric?: string; // Grading criteria for AI evaluation
  timeLimit?: number; // Time limit in seconds for code execution
  memoryLimit?: number; // Memory limit in MB
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  conceptsAssessed: string[]; // Concepts this question tests
}

// Union type for all interactions
export type ContentInteraction =
  | MCQInteraction
  | FillBlankInteraction
  | ReflectionInteraction
  | RevealInteraction
  | ConfirmInteraction
  | CodeInteraction;

// Content Block (text or interaction)
export interface ContentBlock {
  id: string;
  order: number;
  type: ContentBlockType;
  content?: string; // For text blocks
  interaction?: ContentInteraction; // For interaction blocks
  conceptKey?: string; // Links block to a learning concept
  isRequired?: boolean; // Must complete before moving on
}

// Learning Outcome
export interface LearningOutcome {
  id: string;
  description: string;
  aiSuggested: boolean;
  teacherApproved: boolean;
  order: number;
  relatedModules: string[]; // Module IDs that cover this outcome
}

// Interactive Settings for Course
export interface InteractiveSettings {
  interactionFrequency: 'low' | 'medium' | 'high'; // How often interactions appear
  adaptiveLearningEnabled: boolean;
  gradingWeight: {
    interactions: number; // e.g., 0.30 = 30%
    assessments: number; // e.g., 0.70 = 70%
  };
}

// Interaction Response (student's answer to an interaction)
export interface InteractionResponse {
  blockId: string;
  interactionType: InteractionType;
  response: MCQResponse | FillBlankResponse | ReflectionResponse | RevealResponse | ConfirmResponse | CodeResponse;
  isCorrect?: boolean;
  score?: number;
  maxScore: number;
  timeSpent: number; // in seconds
  attempts: number;
  aiFeedback?: string;
  submittedAt: Date;
}

// Response types for each interaction
export interface MCQResponse {
  selectedOptionId: string;
}

export interface FillBlankResponse {
  filledAnswers: Record<string, string>; // blank_id -> answer
}

export interface ReflectionResponse {
  reflectionText: string;
}

export interface RevealResponse {
  revealed: boolean;
}

export interface ConfirmResponse {
  understandingLevel: 'fully' | 'partially' | 'not_yet';
}

export interface CodeResponse {
  code: string;
  language: ProgrammingLanguage;
  executionResults?: {
    testCaseId: string;
    passed: boolean;
    actualOutput?: string;
    error?: string;
    executionTime?: number; // in ms
  }[];
}

// Module Interaction Progress (per module)
export interface ModuleInteractionProgress {
  moduleId: string;
  responses: InteractionResponse[];
  totalScore: number;
  maxPossibleScore: number;
  percentageComplete: number;
  adaptiveDifficultyAdjustment: number; // -5 to +5
  completedAt?: Date;
}

// Extended Learning Metrics (for adaptive learning)
export interface ExtendedLearningMetrics extends LearningMetrics {
  interactionScore: number; // Overall interaction score (0-100)
  interactionAccuracy: number; // Percentage of correct answers
  conceptsMastered: string[]; // Concept keys the student has mastered
  conceptsStruggling: string[]; // Concept keys the student struggles with
  recentTrend: 'improving' | 'stable' | 'declining';
  correctStreak: number;
  incorrectStreak: number;
}

// Adaptive Recommendation
export interface AdaptiveRecommendation {
  type: 'slow_down' | 'speed_up' | 'review' | 'extra_examples' | 'simplify' | 'challenge';
  message: string;
  relatedConceptKeys?: string[];
  suggestedModuleIds?: string[];
}

// Grade Calculation Result
export interface GradeResult {
  interactionScore: number;
  assessmentScore: number;
  finalScore: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    interactions: {
      earned: number;
      possible: number;
      weight: number;
    };
    assessments: {
      earned: number;
      possible: number;
      weight: number;
    };
  };
}

// ==========================================
// Spaced Repetition System (SRS) Types
// ==========================================

// Review Item for SRS
export interface ReviewItem {
  id: string;
  conceptKey: string;
  moduleId: string;
  courseId: string;
  question: string;
  answer: string;
  // SM-2 Algorithm fields
  easeFactor: number; // Default 2.5
  interval: number; // Days until next review
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  // Performance
  correctCount: number;
  incorrectCount: number;
}

export interface IReviewItem {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  moduleId: ObjectId;
  conceptKey: string;
  question: string;
  answer: string;
  // SM-2 Algorithm fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  // Performance tracking
  correctCount: number;
  incorrectCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Learning Path Branching Types
// ==========================================

// Concept Node - represents a learning concept in the path
export interface ConceptNode {
  id: string;
  conceptKey: string;
  title: string;
  moduleId: string;
  prerequisites: string[]; // Other concept IDs
  difficulty: number; // 1-10
  estimatedTime: number; // in minutes
}

// Learning Path - overall course path structure
export interface LearningPath {
  courseId: string;
  nodes: ConceptNode[];
  edges: Array<{ from: string; to: string }>;
  branches: PathBranch[];
}

// Path Branch - conditional branching logic
export interface PathBranch {
  id: string;
  condition: {
    type: 'accuracy_below' | 'accuracy_above' | 'struggling_concept' | 'mastered_concept';
    threshold?: number;
    conceptKey?: string;
  };
  targetModuleId: string;
  branchType: 'remedial' | 'advanced' | 'alternative';
  title: string;
  description: string;
}

// Student Learning Path - personalized path for each student
export interface StudentLearningPath {
  studentId: string;
  courseId: string;
  currentNodeId: string;
  completedNodes: string[];
  skippedNodes: string[];
  branchHistory: Array<{
    branchId: string;
    takenAt: Date;
    reason: string;
  }>;
  suggestedPath: string[]; // Ordered node IDs
}

// Database versions (with ObjectId)
export interface ILearningPath {
  _id: ObjectId;
  courseId: ObjectId;
  nodes: ConceptNode[];
  edges: Array<{ from: string; to: string }>;
  branches: PathBranch[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentLearningPath {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  currentNodeId: string;
  completedNodes: string[];
  skippedNodes: string[];
  branchHistory: Array<{
    branchId: string;
    takenAt: Date;
    reason: string;
  }>;
  suggestedPath: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSession {
  items: ReviewItem[];
  completedCount: number;
  correctCount: number;
  startedAt: Date;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewSubmission {
  itemId: string;
  quality: ReviewQuality;
  timeSpent: number; // in seconds
}

// ==========================================
// Gamification Types
// ==========================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'streak' | 'mastery' | 'exploration';
  requirement: {
    type: 'module_complete' | 'course_complete' | 'streak_days' | 'perfect_score' | 'xp_earned' | 'accuracy' | 'modules_in_day' | 'total_modules';
    value: number;
  };
  xpReward: number;
}

export interface StudentGamification {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  badges: string[]; // Badge IDs
  dailyChallengeCompleted: boolean;
  weeklyGoal: {
    target: number;
    current: number;
    type: 'modules' | 'xp' | 'minutes';
  };
}

export interface DailyChallenge {
  id: string;
  date: Date;
  type: 'quiz' | 'review' | 'time_goal';
  requirement: number;
  xpReward: number;
  completed: boolean;
}

export interface XPAction {
  type: 'module_complete' | 'interaction_correct' | 'interaction_incorrect' | 'perfect_score' | 'daily_challenge' | 'streak_bonus';
  moduleId?: string;
  courseId?: string;
  score?: number;
}

// ==========================================
// Multi-Modal Content Delivery Types
// ==========================================

export type ContentFormat = 'text' | 'visual' | 'audio_description' | 'interactive';

export interface MultiModalContent {
  id: string;
  moduleId: string;
  conceptKey: string;
  formats: {
    text?: string;
    visual?: {
      type: 'diagram' | 'infographic' | 'flowchart' | 'mindmap';
      description: string;
      svgContent?: string;
    };
    audioDescription?: string;  // Text optimized for audio/screen readers
    interactive?: {
      type: 'simulation' | 'drag_drop' | 'timeline';
      config: Record<string, any>;
    };
  };
  preferredFor: LearningStyle[];
}

export interface ContentDeliveryPreference {
  primaryFormat: ContentFormat;
  fallbackFormat: ContentFormat;
  autoSwitch: boolean;  // Auto-switch format if struggling
  textSize: 'small' | 'medium' | 'large';
  codeHighlighting: boolean;
}

// Database versions (with ObjectId)
export interface IMultiModalContent {
  _id: ObjectId;
  moduleId: ObjectId;
  conceptKey: string;
  formats: {
    text?: string;
    visual?: {
      type: 'diagram' | 'infographic' | 'flowchart' | 'mindmap';
      description: string;
      svgContent?: string;
    };
    audioDescription?: string;
    interactive?: {
      type: 'simulation' | 'drag_drop' | 'timeline';
      config: Record<string, any>;
    };
  };
  preferredFor: LearningStyle[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Accessibility Types
// ==========================================

export interface AccessibilitySettings {
  // Visual
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  fontFamily: 'default' | 'dyslexia-friendly' | 'monospace';

  // Motion
  reduceMotion: boolean;

  // Audio
  screenReaderOptimized: boolean;
  autoplayMedia: boolean;

  // Interaction
  keyboardOnly: boolean;
  extendedTimeForInteractions: boolean;
  timeMultiplier: number;  // 1.5x, 2x for interaction timers

  // Focus
  focusIndicatorStyle: 'default' | 'high-visibility';

  // Content
  simplifiedLanguage: boolean;
  showCaptions: boolean;
}

export interface AccessibilityAuditResult {
  score: number;  // 0-100
  issues: AccessibilityIssue[];
  recommendations: string[];
}

export interface AccessibilityIssue {
  type: 'critical' | 'major' | 'minor';
  element: string;
  description: string;
  wcagCriteria: string;  // e.g., "WCAG 2.1 AA 1.4.3"
  suggestedFix: string;
}

// ==========================================
// Predictive Interventions Types
// ==========================================

export interface PredictionModel {
  riskScore: number;  // 0-100, higher = more at risk
  riskFactors: RiskFactor[];
  predictedOutcome: 'complete' | 'at_risk' | 'likely_dropout';
  confidenceScore: number;
  recommendations: PredictiveRecommendation[];
  calculatedAt: Date;
}

export interface RiskFactor {
  type: 'engagement_drop' | 'performance_decline' | 'long_absence' | 'difficulty_spike' | 'pace_mismatch';
  severity: number;  // 0-1
  description: string;
  dataPoints: string[];  // Evidence for this factor
}

export interface PredictiveRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  automatedAction?: {
    type: 'send_reminder' | 'adjust_difficulty' | 'suggest_review' | 'offer_help';
    payload: Record<string, any>;
  };
}

export interface StudentEngagementHistory {
  studentId: string;
  courseId: string;
  dailyActivity: Array<{
    date: Date;
    minutesSpent: number;
    modulesViewed: number;
    interactionsCompleted: number;
    accuracy: number;
  }>;
  weeklyTrends: Array<{
    weekStart: Date;
    avgMinutes: number;
    avgAccuracy: number;
    completionRate: number;
  }>;
}

export interface DailyActivityRecord {
  date: Date;
  minutesSpent: number;
  modulesViewed: number;
  interactionsCompleted: number;
  accuracy: number;
  loginCount: number;
}

export interface IEngagementHistory {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  dailyActivity: DailyActivityRecord[];
  weeklyTrends: Array<{
    weekStart: Date;
    avgMinutes: number;
    avgAccuracy: number;
    completionRate: number;
  }>;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterventionRecord {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  interventionType: 'reminder' | 'motivational' | 'difficulty_adjustment' | 'review_suggestion' | 'help_offer';
  riskScore: number;
  triggeredBy: RiskFactor[];
  message: string;
  tone: 'encouraging' | 'supportive' | 'motivating';
  suggestedActions: string[];
  wasDelivered: boolean;
  studentResponse?: 'acknowledged' | 'engaged' | 'ignored';
  responseTimestamp?: Date;
  effectiveness?: number; // 0-1 score of how well it worked
  createdAt: Date;
  updatedAt: Date;
}
