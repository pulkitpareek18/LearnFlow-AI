import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import connectDB from '@/lib/db/mongoose';
import { StudentLearningPath, LearningPath } from '@/lib/db/models/LearningPath';
import { calculateOptimalPath } from '@/lib/adaptive/learning-path';
import StudentProgress from '@/lib/db/models/StudentProgress';
import { ApiResponse, ExtendedLearningMetrics } from '@/types';

/**
 * POST /api/learning-path/branch
 * Execute a branch (take remedial, skip to advanced, or recalculate path)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'student') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only students can execute branches' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { courseId, branchId, action } = body;

    if (!courseId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const studentPath = await StudentLearningPath.findOne({
      studentId: session.user.id,
      courseId,
    });

    if (!studentPath) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Student learning path not found' },
        { status: 404 }
      );
    }

    const coursePath = await LearningPath.findOne({ courseId });
    if (!coursePath) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Course learning path not found' },
        { status: 404 }
      );
    }

    // Handle different branch actions
    switch (action) {
      case 'accept_remedial':
      case 'accept_advanced':
      case 'accept_branch': {
        if (!branchId) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Branch ID is required' },
            { status: 400 }
          );
        }

        const branch = coursePath.branches.find((b) => b.id === branchId);
        if (!branch) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Branch not found' },
            { status: 404 }
          );
        }

        // Find the target node
        const targetNode = coursePath.nodes.find((n) => n.moduleId === branch.targetModuleId);
        if (!targetNode) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Target module not found' },
            { status: 404 }
          );
        }

        // Update student path
        studentPath.currentNodeId = targetNode.id;
        studentPath.branchHistory.push({
          branchId: branch.id,
          takenAt: new Date(),
          reason: `Accepted ${branch.branchType} branch: ${branch.title}`,
        });

        // If skipping ahead, mark skipped nodes
        if (branch.branchType === 'advanced') {
          const currentIndex = coursePath.nodes.findIndex((n) => n.id === studentPath.currentNodeId);
          const targetIndex = coursePath.nodes.findIndex((n) => n.id === targetNode.id);

          for (let i = currentIndex + 1; i < targetIndex; i++) {
            const skippedNodeId = coursePath.nodes[i].id;
            if (!studentPath.skippedNodes.includes(skippedNodeId)) {
              studentPath.skippedNodes.push(skippedNodeId);
            }
          }
        }

        await studentPath.save();

        return NextResponse.json<ApiResponse>({
          success: true,
          message: `Branch accepted: ${branch.title}`,
          data: {
            studentPath,
            branch,
            targetNode,
          },
        });
      }

      case 'decline_branch': {
        // Continue on current path without branching
        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'Continuing on current learning path',
          data: { studentPath },
        });
      }

      case 'recalculate_path': {
        // Recalculate optimal path based on current metrics
        const progress = await StudentProgress.findOne({
          studentId: session.user.id,
          courseId,
        });

        if (!progress) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Student progress not found' },
            { status: 404 }
          );
        }

        const metrics = progress.learningMetrics as ExtendedLearningMetrics;
        const result = await calculateOptimalPath(metrics, courseId);

        if (!result.success) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: result.error },
            { status: 500 }
          );
        }

        // Update suggested path
        studentPath.suggestedPath = result.path || [];
        studentPath.branchHistory.push({
          branchId: 'recalculate',
          takenAt: new Date(),
          reason: result.reasoning || 'Path recalculated based on performance',
        });

        await studentPath.save();

        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'Learning path recalculated',
          data: {
            studentPath,
            reasoning: result.reasoning,
          },
        });
      }

      case 'skip_module': {
        // Skip current module and move to next
        const currentIndex = coursePath.nodes.findIndex((n) => n.id === studentPath.currentNodeId);
        if (currentIndex >= coursePath.nodes.length - 1) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'No more modules to skip to' },
            { status: 400 }
          );
        }

        const currentNodeId = studentPath.currentNodeId;
        const nextNode = coursePath.nodes[currentIndex + 1];

        studentPath.skippedNodes.push(currentNodeId);
        studentPath.currentNodeId = nextNode.id;
        studentPath.branchHistory.push({
          branchId: 'skip',
          takenAt: new Date(),
          reason: 'Student requested to skip module',
        });

        await studentPath.save();

        return NextResponse.json<ApiResponse>({
          success: true,
          message: 'Module skipped',
          data: {
            studentPath,
            skippedNode: coursePath.nodes[currentIndex],
            nextNode,
          },
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error executing branch:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to execute branch action' },
      { status: 500 }
    );
  }
}
