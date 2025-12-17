import { ObjectId } from 'mongoose';
import {
  ConceptNode,
  PathBranch,
  ExtendedLearningMetrics,
  IModule,
  IChapter,
} from '@/types';
import Course from '@/lib/db/models/Course';
import Chapter from '@/lib/db/models/Chapter';
import Module from '@/lib/db/models/Module';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { LearningPath, StudentLearningPath } from '@/lib/db/models/LearningPath';

/**
 * Generate initial learning path from course structure
 */
export async function generateCoursePath(courseId: string | ObjectId): Promise<{
  success: boolean;
  path?: any;
  error?: string;
}> {
  try {
    // Check if path already exists
    const existingPath = await LearningPath.findOne({ courseId });
    if (existingPath) {
      return { success: true, path: existingPath };
    }

    // Fetch course with chapters and modules
    const course = await Course.findById(courseId).populate('chapters');
    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    const nodes: ConceptNode[] = [];
    const edges: Array<{ from: string; to: string }> = [];
    const branches: PathBranch[] = [];

    // Get all chapters with their modules
    const chapters = await Chapter.find({ _id: { $in: course.chapters } })
      .sort({ order: 1 })
      .lean();

    let previousNodeId: string | null = null;

    for (const chapter of chapters) {
      // Get modules for this chapter
      const modules = await Module.find({ chapterId: chapter._id })
        .sort({ order: 1 })
        .lean();

      for (const module of modules) {
        const nodeId = `node_${module._id.toString()}`;
        const conceptKey = `${chapter.title.toLowerCase().replace(/\s+/g, '_')}_${module.title.toLowerCase().replace(/\s+/g, '_')}`;

        // Create concept node
        const node: ConceptNode = {
          id: nodeId,
          conceptKey,
          title: module.title,
          moduleId: module._id.toString(),
          prerequisites: previousNodeId ? [previousNodeId] : [],
          difficulty: module.difficultyLevel || 5,
          estimatedTime: module.estimatedTime || 15,
        };

        nodes.push(node);

        // Create edge from previous node
        if (previousNodeId) {
          edges.push({ from: previousNodeId, to: nodeId });
        }

        previousNodeId = nodeId;
      }
    }

    // Generate intelligent branches based on difficulty patterns
    generateAutoBranches(nodes, branches);

    // Create and save learning path
    const learningPath = await LearningPath.create({
      courseId,
      nodes,
      edges,
      branches,
    });

    return { success: true, path: learningPath };
  } catch (error) {
    console.error('Error generating course path:', error);
    return { success: false, error: 'Failed to generate learning path' };
  }
}

/**
 * Auto-generate branches based on difficulty patterns
 */
function generateAutoBranches(nodes: ConceptNode[], branches: PathBranch[]): void {
  // Find difficulty jumps and create remedial branches
  for (let i = 1; i < nodes.length; i++) {
    const currentNode = nodes[i];
    const previousNode = nodes[i - 1];

    // If difficulty jumps by 3+ levels, create remedial branch
    if (currentNode.difficulty - previousNode.difficulty >= 3) {
      // Find a lower difficulty module to branch to
      const remedialNode = nodes
        .slice(0, i)
        .reverse()
        .find((n) => n.difficulty <= previousNode.difficulty);

      if (remedialNode) {
        branches.push({
          id: `branch_remedial_${currentNode.id}`,
          condition: {
            type: 'accuracy_below',
            threshold: 60,
          },
          targetModuleId: remedialNode.moduleId,
          branchType: 'remedial',
          title: 'Review Fundamentals',
          description: `We noticed this topic builds on earlier concepts. Review "${remedialNode.title}" to strengthen your foundation.`,
        });
      }
    }

    // Create advanced skip option for high performers
    if (currentNode.difficulty <= 5 && i < nodes.length - 2) {
      branches.push({
        id: `branch_advanced_${currentNode.id}`,
        condition: {
          type: 'accuracy_above',
          threshold: 90,
          conceptKey: currentNode.conceptKey,
        },
        targetModuleId: nodes[i + 2]?.moduleId || currentNode.moduleId,
        branchType: 'advanced',
        title: 'Skip Ahead',
        description: `You've mastered these concepts! Skip to more advanced content.`,
      });
    }
  }
}

/**
 * Evaluate next node based on student performance
 */
export async function evaluateNextNode(
  studentId: string | ObjectId,
  courseId: string | ObjectId
): Promise<{
  success: boolean;
  nextNode?: any;
  branch?: any;
  recommendation?: string;
  error?: string;
}> {
  try {
    // Get student's learning path
    const studentPath = await StudentLearningPath.findOne({ studentId, courseId });
    const coursePath = await LearningPath.findOne({ courseId });

    if (!coursePath) {
      return { success: false, error: 'Course learning path not found' };
    }

    // Get student progress and metrics
    const progress = await StudentProgress.findOne({ studentId, courseId });
    if (!progress) {
      return { success: false, error: 'Student progress not found' };
    }

    const metrics = progress.learningMetrics as ExtendedLearningMetrics;

    // If no student path exists yet, start from beginning
    if (!studentPath) {
      const firstNode = coursePath.nodes[0];
      return {
        success: true,
        nextNode: firstNode,
        recommendation: 'Start your learning journey!',
      };
    }

    // Check if branching is needed
    const branchResult = await checkBranchConditions(metrics, coursePath.branches, studentPath);
    if (branchResult.shouldBranch && branchResult.branch) {
      return {
        success: true,
        nextNode: coursePath.nodes.find((n) => n.moduleId === branchResult.branch!.targetModuleId),
        branch: branchResult.branch,
        recommendation: branchResult.branch.description,
      };
    }

    // Get next sequential node
    const currentNodeIndex = coursePath.nodes.findIndex(
      (n) => n.id === studentPath.currentNodeId
    );

    if (currentNodeIndex === -1 || currentNodeIndex >= coursePath.nodes.length - 1) {
      return {
        success: true,
        recommendation: 'You have completed this learning path!',
      };
    }

    const nextNode = coursePath.nodes[currentNodeIndex + 1];
    return {
      success: true,
      nextNode,
      recommendation: 'Continue to the next module',
    };
  } catch (error) {
    console.error('Error evaluating next node:', error);
    return { success: false, error: 'Failed to evaluate next node' };
  }
}

/**
 * Check if student should branch based on performance
 */
export async function checkBranchConditions(
  studentMetrics: ExtendedLearningMetrics,
  branches: PathBranch[],
  studentPath: any
): Promise<{
  shouldBranch: boolean;
  branch?: PathBranch;
  reason?: string;
}> {
  for (const branch of branches) {
    const condition = branch.condition;

    switch (condition.type) {
      case 'accuracy_below':
        if (
          studentMetrics.interactionAccuracy < (condition.threshold || 60) &&
          studentMetrics.incorrectStreak >= 3
        ) {
          return {
            shouldBranch: true,
            branch,
            reason: `Accuracy below ${condition.threshold}% - recommending review`,
          };
        }
        break;

      case 'accuracy_above':
        if (
          studentMetrics.interactionAccuracy >= (condition.threshold || 90) &&
          studentMetrics.correctStreak >= 5
        ) {
          return {
            shouldBranch: true,
            branch,
            reason: `High accuracy - recommending advanced content`,
          };
        }
        break;

      case 'struggling_concept':
        if (
          condition.conceptKey &&
          studentMetrics.conceptsStruggling.includes(condition.conceptKey)
        ) {
          return {
            shouldBranch: true,
            branch,
            reason: `Struggling with ${condition.conceptKey} - recommending remedial path`,
          };
        }
        break;

      case 'mastered_concept':
        if (
          condition.conceptKey &&
          studentMetrics.conceptsMastered.includes(condition.conceptKey)
        ) {
          return {
            shouldBranch: true,
            branch,
            reason: `Mastered ${condition.conceptKey} - recommending skip ahead`,
          };
        }
        break;
    }
  }

  return { shouldBranch: false };
}

/**
 * Generate remedial path for struggling concepts
 */
export async function suggestRemedialPath(
  strugglingConcepts: string[],
  courseId: string | ObjectId
): Promise<{
  success: boolean;
  path?: string[];
  error?: string;
}> {
  try {
    const coursePath = await LearningPath.findOne({ courseId });
    if (!coursePath) {
      return { success: false, error: 'Course path not found' };
    }

    const remedialNodeIds: string[] = [];

    // Find nodes matching struggling concepts
    for (const concept of strugglingConcepts) {
      const node = coursePath.nodes.find((n) => n.conceptKey === concept);
      if (node) {
        // Add the struggling node
        remedialNodeIds.push(node.id);

        // Add prerequisite nodes for review
        for (const prereqId of node.prerequisites) {
          if (!remedialNodeIds.includes(prereqId)) {
            remedialNodeIds.push(prereqId);
          }
        }
      }
    }

    // Sort by original order
    const sortedPath = remedialNodeIds.sort((a, b) => {
      const indexA = coursePath.nodes.findIndex((n) => n.id === a);
      const indexB = coursePath.nodes.findIndex((n) => n.id === b);
      return indexA - indexB;
    });

    return { success: true, path: sortedPath };
  } catch (error) {
    console.error('Error suggesting remedial path:', error);
    return { success: false, error: 'Failed to generate remedial path' };
  }
}

/**
 * Generate advanced path for high performers
 */
export async function suggestAdvancedPath(
  masteredConcepts: string[],
  courseId: string | ObjectId
): Promise<{
  success: boolean;
  path?: string[];
  error?: string;
}> {
  try {
    const coursePath = await LearningPath.findOne({ courseId });
    if (!coursePath) {
      return { success: false, error: 'Course path not found' };
    }

    // Filter out mastered concepts and focus on higher difficulty
    const advancedPath = coursePath.nodes
      .filter((node) => {
        return (
          !masteredConcepts.includes(node.conceptKey) &&
          node.difficulty >= 6 // Focus on harder content
        );
      })
      .map((n) => n.id);

    return { success: true, path: advancedPath };
  } catch (error) {
    console.error('Error suggesting advanced path:', error);
    return { success: false, error: 'Failed to generate advanced path' };
  }
}

/**
 * Calculate optimal path using student metrics
 */
export async function calculateOptimalPath(
  studentMetrics: ExtendedLearningMetrics,
  courseId: string | ObjectId
): Promise<{
  success: boolean;
  path?: string[];
  reasoning?: string;
  error?: string;
}> {
  try {
    const coursePath = await LearningPath.findOne({ courseId });
    if (!coursePath) {
      return { success: false, error: 'Course path not found' };
    }

    let optimalPath: string[] = [];
    let reasoning = '';

    // High performer: skip easier content
    if (studentMetrics.interactionAccuracy >= 85 && studentMetrics.recentTrend === 'improving') {
      optimalPath = coursePath.nodes
        .filter((n) => n.difficulty >= 5)
        .map((n) => n.id);
      reasoning = 'Advanced path - focusing on challenging content based on high performance';
    }
    // Struggling: include remedial content
    else if (
      studentMetrics.interactionAccuracy < 60 ||
      studentMetrics.conceptsStruggling.length > 2
    ) {
      const remedialResult = await suggestRemedialPath(
        studentMetrics.conceptsStruggling,
        courseId
      );
      if (remedialResult.success && remedialResult.path) {
        optimalPath = remedialResult.path;
        reasoning = 'Remedial path - reviewing fundamentals to build stronger foundation';
      }
    }
    // Standard path with difficulty adjustment
    else {
      const targetDifficulty = studentMetrics.adaptiveDifficulty || 5;
      optimalPath = coursePath.nodes
        .filter((n) => Math.abs(n.difficulty - targetDifficulty) <= 2)
        .map((n) => n.id);
      reasoning = `Balanced path - content matched to difficulty level ${targetDifficulty}`;
    }

    // If no path generated, use full sequential path
    if (optimalPath.length === 0) {
      optimalPath = coursePath.nodes.map((n) => n.id);
      reasoning = 'Standard sequential path';
    }

    return { success: true, path: optimalPath, reasoning };
  } catch (error) {
    console.error('Error calculating optimal path:', error);
    return { success: false, error: 'Failed to calculate optimal path' };
  }
}

/**
 * Initialize student learning path when enrolling
 */
export async function initializeStudentPath(
  studentId: string | ObjectId,
  courseId: string | ObjectId
): Promise<{
  success: boolean;
  studentPath?: any;
  error?: string;
}> {
  try {
    // Check if already exists
    const existing = await StudentLearningPath.findOne({ studentId, courseId });
    if (existing) {
      return { success: true, studentPath: existing };
    }

    // Get course path
    const coursePath = await LearningPath.findOne({ courseId });
    if (!coursePath) {
      // Generate it if it doesn't exist
      const generateResult = await generateCoursePath(courseId);
      if (!generateResult.success) {
        return { success: false, error: 'Failed to generate course path' };
      }
    }

    const refreshedPath = await LearningPath.findOne({ courseId });
    if (!refreshedPath || refreshedPath.nodes.length === 0) {
      return { success: false, error: 'No nodes in course path' };
    }

    // Create student path starting from first node
    const studentPath = await StudentLearningPath.create({
      studentId,
      courseId,
      currentNodeId: refreshedPath.nodes[0].id,
      completedNodes: [],
      skippedNodes: [],
      branchHistory: [],
      suggestedPath: refreshedPath.nodes.map((n) => n.id),
    });

    return { success: true, studentPath };
  } catch (error) {
    console.error('Error initializing student path:', error);
    return { success: false, error: 'Failed to initialize student path' };
  }
}
