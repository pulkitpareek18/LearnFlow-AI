'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Map,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface PathNode {
  id: string;
  conceptKey: string;
  title: string;
  moduleId: string;
  prerequisites: string[];
  difficulty: number;
  estimatedTime: number;
}

interface StudentPath {
  currentNodeId: string;
  completedNodes: string[];
  skippedNodes: string[];
  suggestedPath: string[];
}

interface PathBranch {
  id: string;
  branchType: 'remedial' | 'advanced';
  title: string;
  description: string;
  targetModuleId: string;
}

export default function LearningPathPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [nodes, setNodes] = useState<PathNode[]>([]);
  const [studentPath, setStudentPath] = useState<StudentPath | null>(null);
  const [suggestedBranch, setSuggestedBranch] = useState<PathBranch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchLearningPath();
    }
  }, [courseId]);

  const fetchLearningPath = async () => {
    try {
      const response = await fetch(`/api/learning-path?courseId=${courseId}`);
      const result = await response.json();

      if (result.success) {
        setNodes(result.data.nodes || []);
        setStudentPath(result.data.studentPath || null);
        setSuggestedBranch(result.data.suggestedBranch || null);
      } else {
        setError(result.error || 'Failed to load learning path');
      }
    } catch (err) {
      setError('Failed to fetch learning path');
    } finally {
      setIsLoading(false);
    }
  };

  const getNodeStatus = (nodeId: string): 'completed' | 'current' | 'locked' | 'available' => {
    if (!studentPath) return 'locked';
    if (studentPath.completedNodes.includes(nodeId)) return 'completed';
    if (studentPath.currentNodeId === nodeId) return 'current';

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 'locked';

    const prerequisitesMet = node.prerequisites.every(
      prereq => studentPath.completedNodes.includes(prereq)
    );
    return prerequisitesMet ? 'available' : 'locked';
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return 'text-success';
    if (difficulty <= 6) return 'text-warning';
    return 'text-error';
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 3) return 'Beginner';
    if (difficulty <= 6) return 'Intermediate';
    return 'Advanced';
  };

  const handleFollowBranch = async (branch: PathBranch) => {
    try {
      await fetch('/api/learning-path/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          branchId: branch.id,
          targetModuleId: branch.targetModuleId,
        }),
      });
      fetchLearningPath();
    } catch (err) {
      console.error('Failed to follow branch:', err);
    }
  };

  if (!courseId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card variant="bordered">
          <CardContent className="text-center py-12">
            <Map className="w-16 h-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Course Selected
            </h2>
            <p className="text-muted mb-6">
              Select a course to view your personalized learning path
            </p>
            <Link href="/student/courses">
              <Button>
                View My Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Map className="w-8 h-8 text-primary" />
          Your Learning Path
        </h1>
        <p className="text-muted mt-1">
          Track your progress and navigate your personalized learning journey
        </p>
      </div>

      {/* Suggested Branch Alert */}
      {suggestedBranch && (
        <Card variant="bordered" className="border-primary bg-primary/5">
          <CardContent className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              suggestedBranch.branchType === 'remedial'
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
            }`}>
              {suggestedBranch.branchType === 'remedial' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Zap className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {suggestedBranch.title}
              </h3>
              <p className="text-sm text-muted mt-1">
                {suggestedBranch.description}
              </p>
              <Button
                size="sm"
                className="mt-3"
                variant={suggestedBranch.branchType === 'remedial' ? 'outline' : 'primary'}
                onClick={() => handleFollowBranch(suggestedBranch)}
              >
                {suggestedBranch.branchType === 'remedial' ? 'Review Content' : 'Skip Ahead'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      {studentPath && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card variant="bordered">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {studentPath.completedNodes.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted">Remaining</p>
                <p className="text-2xl font-bold text-foreground">
                  {nodes.length - studentPath.completedNodes.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-info/10">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted">Progress</p>
                <p className="text-2xl font-bold text-foreground">
                  {nodes.length > 0
                    ? Math.round((studentPath.completedNodes.length / nodes.length) * 100)
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Learning Path Visualization */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Learning Modules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
              <p className="text-error">{error}</p>
            </div>
          ) : nodes.length > 0 ? (
            <div className="relative">
              {/* Vertical line connecting nodes */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />

              <div className="space-y-4">
                {nodes.map((node, index) => {
                  const status = getNodeStatus(node.id);
                  const isClickable = status === 'current' || status === 'available' || status === 'completed';

                  return (
                    <div
                      key={node.id}
                      className={`relative flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        status === 'current'
                          ? 'border-primary bg-primary/5'
                          : status === 'completed'
                          ? 'border-success/30 bg-success/5'
                          : status === 'available'
                          ? 'border-border hover:border-primary/50'
                          : 'border-border opacity-60'
                      }`}
                    >
                      {/* Status Icon */}
                      <div className={`z-10 p-2 rounded-full ${
                        status === 'completed'
                          ? 'bg-success text-white'
                          : status === 'current'
                          ? 'bg-primary text-white'
                          : status === 'available'
                          ? 'bg-background border-2 border-primary text-primary'
                          : 'bg-border text-muted'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : status === 'locked' ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {node.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-sm">
                              <span className={getDifficultyColor(node.difficulty)}>
                                {getDifficultyLabel(node.difficulty)}
                              </span>
                              <span className="text-muted flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {node.estimatedTime} min
                              </span>
                            </div>
                          </div>

                          {isClickable && (
                            <Link href={`/student/learn/${courseId}?module=${node.moduleId}`}>
                              <Button
                                size="sm"
                                variant={status === 'current' ? 'primary' : 'outline'}
                              >
                                {status === 'completed' ? 'Review' : 'Start'}
                                <BookOpen className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Map className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">No learning path available for this course</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
