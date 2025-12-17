/**
 * Unit Tests for Learning Path System
 */

import { PathBranch, ExtendedLearningMetrics, ConceptNode } from '@/types';

// Mock the database models
jest.mock('@/lib/db/models/Course', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/lib/db/models/Chapter', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/lib/db/models/Module', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/lib/db/models/StudentProgress', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/db/models/LearningPath', () => ({
  LearningPath: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  StudentLearningPath: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

// Import after mocks
import {
  checkBranchConditions,
} from '@/lib/adaptive/learning-path';
import { LearningPath, StudentLearningPath } from '@/lib/db/models/LearningPath';

describe('Learning Path System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkBranchConditions', () => {
    const mockStudentPath = {
      currentNodeId: 'node_1',
      completedNodes: ['node_0'],
    };

    it('should detect low accuracy and recommend remedial branch', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 45,
        incorrectStreak: 4,
        correctStreak: 0,
        conceptsStruggling: ['algebra_basics'],
        conceptsMastered: [],
        recentTrend: 'declining',
        adaptiveDifficulty: 3,
        averageResponseTime: 30,
        totalInteractions: 50,
        averageSessionLength: 25,
        totalTimeSpent: 500,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_1',
          condition: {
            type: 'accuracy_below',
            threshold: 60,
          },
          targetModuleId: 'module_remedial',
          branchType: 'remedial',
          title: 'Review Basics',
          description: 'Review fundamental concepts',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      expect(result.shouldBranch).toBe(true);
      expect(result.branch?.branchType).toBe('remedial');
      expect(result.reason).toContain('Accuracy below');
    });

    it('should detect high accuracy and recommend advanced branch', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 95,
        incorrectStreak: 0,
        correctStreak: 8,
        conceptsStruggling: [],
        conceptsMastered: ['algebra_basics', 'algebra_advanced'],
        recentTrend: 'improving',
        adaptiveDifficulty: 7,
        averageResponseTime: 15,
        totalInteractions: 100,
        averageSessionLength: 30,
        totalTimeSpent: 900,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_advanced',
          condition: {
            type: 'accuracy_above',
            threshold: 90,
          },
          targetModuleId: 'module_advanced',
          branchType: 'advanced',
          title: 'Skip Ahead',
          description: 'Move to advanced content',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      expect(result.shouldBranch).toBe(true);
      expect(result.branch?.branchType).toBe('advanced');
      expect(result.reason).toContain('High accuracy');
    });

    it('should detect struggling concept and recommend review', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 70,
        incorrectStreak: 1,
        correctStreak: 2,
        conceptsStruggling: ['calculus_derivatives'],
        conceptsMastered: ['algebra_basics'],
        recentTrend: 'stable',
        adaptiveDifficulty: 5,
        averageResponseTime: 25,
        totalInteractions: 75,
        averageSessionLength: 28,
        totalTimeSpent: 700,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_concept',
          condition: {
            type: 'struggling_concept',
            conceptKey: 'calculus_derivatives',
          },
          targetModuleId: 'module_derivatives_review',
          branchType: 'remedial',
          title: 'Derivatives Review',
          description: 'Review derivative concepts',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      expect(result.shouldBranch).toBe(true);
      expect(result.branch?.id).toBe('branch_concept');
      expect(result.reason).toContain('calculus_derivatives');
    });

    it('should detect mastered concept and allow skip', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 88,
        incorrectStreak: 0,
        correctStreak: 4,
        conceptsStruggling: [],
        conceptsMastered: ['algebra_basics', 'algebra_equations'],
        recentTrend: 'improving',
        adaptiveDifficulty: 6,
        averageResponseTime: 20,
        totalInteractions: 80,
        averageSessionLength: 30,
        totalTimeSpent: 800,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_skip',
          condition: {
            type: 'mastered_concept',
            conceptKey: 'algebra_equations',
          },
          targetModuleId: 'module_next',
          branchType: 'advanced',
          title: 'Skip to Next',
          description: 'Skip mastered content',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      expect(result.shouldBranch).toBe(true);
      expect(result.branch?.branchType).toBe('advanced');
      expect(result.reason).toContain('Mastered');
    });

    it('should not branch when conditions are not met', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 75,
        incorrectStreak: 1,
        correctStreak: 3,
        conceptsStruggling: [],
        conceptsMastered: [],
        recentTrend: 'stable',
        adaptiveDifficulty: 5,
        averageResponseTime: 22,
        totalInteractions: 60,
        averageSessionLength: 25,
        totalTimeSpent: 600,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_1',
          condition: {
            type: 'accuracy_below',
            threshold: 60,
          },
          targetModuleId: 'module_1',
          branchType: 'remedial',
          title: 'Remedial',
          description: 'Remedial path',
        },
        {
          id: 'branch_2',
          condition: {
            type: 'accuracy_above',
            threshold: 90,
          },
          targetModuleId: 'module_2',
          branchType: 'advanced',
          title: 'Advanced',
          description: 'Advanced path',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      expect(result.shouldBranch).toBe(false);
      expect(result.branch).toBeUndefined();
    });

    it('should not branch with empty branches array', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 50,
        incorrectStreak: 5,
        correctStreak: 0,
        conceptsStruggling: ['all_topics'],
        conceptsMastered: [],
        recentTrend: 'declining',
        adaptiveDifficulty: 2,
        averageResponseTime: 45,
        totalInteractions: 30,
        averageSessionLength: 15,
        totalTimeSpent: 300,
      };

      const result = await checkBranchConditions(metrics, [], mockStudentPath);

      expect(result.shouldBranch).toBe(false);
    });

    it('should require incorrect streak for accuracy_below branch', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 55, // Below threshold
        incorrectStreak: 1, // But not enough incorrect streak
        correctStreak: 2,
        conceptsStruggling: [],
        conceptsMastered: [],
        recentTrend: 'stable',
        adaptiveDifficulty: 5,
        averageResponseTime: 25,
        totalInteractions: 50,
        averageSessionLength: 20,
        totalTimeSpent: 400,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_1',
          condition: {
            type: 'accuracy_below',
            threshold: 60,
          },
          targetModuleId: 'module_1',
          branchType: 'remedial',
          title: 'Remedial',
          description: 'Remedial path',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      // Should not branch because incorrectStreak < 3
      expect(result.shouldBranch).toBe(false);
    });

    it('should require correct streak for accuracy_above branch', async () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 92, // Above threshold
        incorrectStreak: 0,
        correctStreak: 3, // But not enough correct streak (needs 5)
        conceptsStruggling: [],
        conceptsMastered: [],
        recentTrend: 'improving',
        adaptiveDifficulty: 7,
        averageResponseTime: 18,
        totalInteractions: 80,
        averageSessionLength: 30,
        totalTimeSpent: 720,
      };

      const branches: PathBranch[] = [
        {
          id: 'branch_advanced',
          condition: {
            type: 'accuracy_above',
            threshold: 90,
          },
          targetModuleId: 'module_advanced',
          branchType: 'advanced',
          title: 'Advanced',
          description: 'Advanced path',
        },
      ];

      const result = await checkBranchConditions(metrics, branches, mockStudentPath);

      // Should not branch because correctStreak < 5
      expect(result.shouldBranch).toBe(false);
    });
  });

  describe('ConceptNode Structure', () => {
    it('should validate concept node has required fields', () => {
      const node: ConceptNode = {
        id: 'node_1',
        conceptKey: 'math_addition',
        title: 'Addition Basics',
        moduleId: 'mod_1',
        prerequisites: [],
        difficulty: 3,
        estimatedTime: 15,
      };

      expect(node.id).toBeDefined();
      expect(node.conceptKey).toBeDefined();
      expect(node.title).toBeDefined();
      expect(node.moduleId).toBeDefined();
      expect(node.difficulty).toBeGreaterThanOrEqual(1);
      expect(node.difficulty).toBeLessThanOrEqual(10);
      expect(node.estimatedTime).toBeGreaterThan(0);
    });

    it('should allow nodes with prerequisites', () => {
      const prerequisiteNode: ConceptNode = {
        id: 'node_1',
        conceptKey: 'math_addition',
        title: 'Addition',
        moduleId: 'mod_1',
        prerequisites: [],
        difficulty: 2,
        estimatedTime: 10,
      };

      const dependentNode: ConceptNode = {
        id: 'node_2',
        conceptKey: 'math_multiplication',
        title: 'Multiplication',
        moduleId: 'mod_2',
        prerequisites: ['node_1'],
        difficulty: 4,
        estimatedTime: 20,
      };

      expect(dependentNode.prerequisites).toContain(prerequisiteNode.id);
    });
  });

  describe('PathBranch Conditions', () => {
    it('should define remedial branch correctly', () => {
      const branch: PathBranch = {
        id: 'branch_remedial_1',
        condition: {
          type: 'accuracy_below',
          threshold: 60,
        },
        targetModuleId: 'mod_review',
        branchType: 'remedial',
        title: 'Review Section',
        description: 'Review previous material',
      };

      expect(branch.branchType).toBe('remedial');
      expect(branch.condition.type).toBe('accuracy_below');
      expect(branch.condition.threshold).toBe(60);
    });

    it('should define advanced branch correctly', () => {
      const branch: PathBranch = {
        id: 'branch_advanced_1',
        condition: {
          type: 'accuracy_above',
          threshold: 90,
        },
        targetModuleId: 'mod_advanced',
        branchType: 'advanced',
        title: 'Advanced Section',
        description: 'Skip to advanced content',
      };

      expect(branch.branchType).toBe('advanced');
      expect(branch.condition.type).toBe('accuracy_above');
      expect(branch.condition.threshold).toBe(90);
    });

    it('should define concept-based branches', () => {
      const strugglingBranch: PathBranch = {
        id: 'branch_concept_1',
        condition: {
          type: 'struggling_concept',
          conceptKey: 'algebra_factoring',
        },
        targetModuleId: 'mod_factoring_review',
        branchType: 'remedial',
        title: 'Factoring Review',
        description: 'Review factoring concepts',
      };

      const masteredBranch: PathBranch = {
        id: 'branch_concept_2',
        condition: {
          type: 'mastered_concept',
          conceptKey: 'algebra_basics',
        },
        targetModuleId: 'mod_advanced_algebra',
        branchType: 'advanced',
        title: 'Advanced Algebra',
        description: 'Move to advanced algebra',
      };

      expect(strugglingBranch.condition.type).toBe('struggling_concept');
      expect(masteredBranch.condition.type).toBe('mastered_concept');
    });
  });

  describe('ExtendedLearningMetrics Validation', () => {
    it('should track all required metrics', () => {
      const metrics: ExtendedLearningMetrics = {
        interactionAccuracy: 75,
        incorrectStreak: 0,
        correctStreak: 3,
        conceptsStruggling: ['concept_a'],
        conceptsMastered: ['concept_b', 'concept_c'],
        recentTrend: 'improving',
        adaptiveDifficulty: 5,
        averageResponseTime: 20,
        totalInteractions: 100,
        averageSessionLength: 25,
        totalTimeSpent: 500,
      };

      expect(metrics.interactionAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.interactionAccuracy).toBeLessThanOrEqual(100);
      expect(metrics.incorrectStreak).toBeGreaterThanOrEqual(0);
      expect(metrics.correctStreak).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(metrics.conceptsStruggling)).toBe(true);
      expect(Array.isArray(metrics.conceptsMastered)).toBe(true);
      expect(['improving', 'stable', 'declining']).toContain(metrics.recentTrend);
    });

    it('should identify improving student', () => {
      const improvingMetrics: ExtendedLearningMetrics = {
        interactionAccuracy: 85,
        incorrectStreak: 0,
        correctStreak: 7,
        conceptsStruggling: [],
        conceptsMastered: ['topic_1', 'topic_2'],
        recentTrend: 'improving',
        adaptiveDifficulty: 6,
        averageResponseTime: 18,
        totalInteractions: 150,
        averageSessionLength: 30,
        totalTimeSpent: 900,
      };

      expect(improvingMetrics.recentTrend).toBe('improving');
      expect(improvingMetrics.correctStreak).toBeGreaterThan(5);
      expect(improvingMetrics.conceptsStruggling.length).toBe(0);
    });

    it('should identify struggling student', () => {
      const strugglingMetrics: ExtendedLearningMetrics = {
        interactionAccuracy: 45,
        incorrectStreak: 5,
        correctStreak: 0,
        conceptsStruggling: ['topic_1', 'topic_2', 'topic_3'],
        conceptsMastered: [],
        recentTrend: 'declining',
        adaptiveDifficulty: 3,
        averageResponseTime: 45,
        totalInteractions: 40,
        averageSessionLength: 12,
        totalTimeSpent: 240,
      };

      expect(strugglingMetrics.recentTrend).toBe('declining');
      expect(strugglingMetrics.incorrectStreak).toBeGreaterThan(3);
      expect(strugglingMetrics.conceptsStruggling.length).toBeGreaterThan(2);
    });
  });
});
