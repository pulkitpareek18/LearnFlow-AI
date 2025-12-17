/**
 * Adaptive Learning Module
 *
 * Exports all adaptive learning utilities
 */

// Performance Calculator
export {
  calculatePerformanceMetrics,
  calculateCourseProgress,
  calculateTimeRemaining,
  type PerformanceMetrics,
} from './calculator';

// Difficulty Engine
export {
  calculateDifficultyAdjustment,
  shouldSkipModule,
  getRecommendedNextModule,
  getContentAdaptations,
  type DifficultyDecision,
  type DifficultyRules,
} from './difficulty';

// Grading
export {
  calculateFinalGrade,
  getLetterGrade,
  getGradeDescription,
  calculateProgressToPass,
  calculateModuleGrade,
  generateGradeReport,
  checkCourseCompletion,
  type GradingInput,
} from './grading';

// Spaced Repetition System (SRS)
export {
  calculateNextReview,
  getDueItems,
  updateReviewItem,
  getReviewStats,
  generateReviewItems,
  getReviewSchedule,
  type SM2Result,
} from './spaced-repetition';

// Learning Path
export {
  generateCoursePath,
  evaluateNextNode,
  checkBranchConditions,
  suggestRemedialPath,
  suggestAdvancedPath,
  calculateOptimalPath,
  initializeStudentPath,
} from './learning-path';

// Predictive Interventions
export {
  calculateRiskScore,
  identifyRiskFactors,
  generatePredictiveRecommendations,
  shouldTriggerIntervention,
} from './prediction';

// Real-Time Struggle Detection
export {
  detectStruggle,
  StruggleTracker,
  type StruggleIndicator,
  type StruggleDetectionResult,
  type InteractionEvent,
} from './struggle-detection';
