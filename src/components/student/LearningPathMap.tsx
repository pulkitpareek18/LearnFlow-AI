'use client';

import { useEffect, useState } from 'react';
import {
  GitBranch,
  CheckCircle,
  Circle,
  Lock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { ConceptNode } from '@/types';

interface LearningPathMapProps {
  courseId: string;
  onNodeClick?: (node: ConceptNode) => void;
}

interface PathData {
  coursePath: {
    nodes: ConceptNode[];
    edges: Array<{ from: string; to: string }>;
    branches: Array<{
      id: string;
      branchType: 'remedial' | 'advanced' | 'alternative';
      title: string;
      targetModuleId: string;
    }>;
  };
  studentPath?: {
    currentNodeId: string;
    completedNodes: string[];
    skippedNodes: string[];
    suggestedPath: string[];
  };
}

export default function LearningPathMap({ courseId, onNodeClick }: LearningPathMapProps) {
  const [pathData, setPathData] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'linear' | 'graph'>('linear');

  useEffect(() => {
    fetchPathData();
  }, [courseId]);

  const fetchPathData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/learning-path?courseId=${courseId}`);
      const data = await response.json();

      if (data.success) {
        setPathData(data.data);
      } else {
        setError(data.error || 'Failed to load learning path');
      }
    } catch (err) {
      setError('Failed to fetch learning path');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNodeStatus = (node: ConceptNode): 'completed' | 'current' | 'upcoming' | 'locked' | 'skipped' => {
    if (!pathData?.studentPath) return 'upcoming';

    if (pathData.studentPath.completedNodes.includes(node.id)) {
      return 'completed';
    }
    if (pathData.studentPath.skippedNodes.includes(node.id)) {
      return 'skipped';
    }
    if (pathData.studentPath.currentNodeId === node.id) {
      return 'current';
    }

    // Check if prerequisites are met
    const allPrereqsCompleted = node.prerequisites.every(
      (prereqId) =>
        pathData.studentPath!.completedNodes.includes(prereqId) ||
        pathData.studentPath!.skippedNodes.includes(prereqId)
    );

    return allPrereqsCompleted ? 'upcoming' : 'locked';
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return 'text-green-600 bg-green-50';
    if (difficulty <= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Target className="w-5 h-5 text-primary" />;
      case 'skipped':
        return <ArrowRight className="w-5 h-5 text-gray-400" />;
      case 'locked':
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBranchesForNode = (nodeId: string) => {
    if (!pathData) return [];

    return pathData.coursePath.branches.filter((branch) => {
      const targetNode = pathData.coursePath.nodes.find(
        (n) => n.moduleId === branch.targetModuleId
      );
      return targetNode && pathData.coursePath.edges.some(
        (edge) => edge.from === nodeId || edge.to === nodeId
      );
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted">Loading learning path...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !pathData) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            {error || 'No learning path available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Learning Path</h2>
          <p className="text-muted mt-1">
            {pathData.studentPath?.completedNodes.length || 0} of {pathData.coursePath.nodes.length} modules completed
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('linear')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'linear'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Linear View
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Graph View
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {pathData.studentPath && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all duration-500"
                    style={{
                      width: `${(pathData.studentPath.completedNodes.length / pathData.coursePath.nodes.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                {Math.round((pathData.studentPath.completedNodes.length / pathData.coursePath.nodes.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linear View */}
      {viewMode === 'linear' && (
        <div className="space-y-3">
          {pathData.coursePath.nodes.map((node, index) => {
            const status = getNodeStatus(node);
            const branches = getBranchesForNode(node.id);
            const isClickable = status !== 'locked';

            return (
              <div key={node.id}>
                <Card
                  className={`transition-all ${
                    isClickable ? 'cursor-pointer hover:shadow-md' : 'opacity-60'
                  } ${status === 'current' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => isClickable && onNodeClick?.(node)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(status)}
                      </div>

                      {/* Node Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {node.title}
                          </h3>
                          {status === 'current' && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {node.estimatedTime} min
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                              node.difficulty
                            )}`}
                          >
                            Level {node.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Branch Indicators */}
                      {branches.length > 0 && (
                        <div className="flex-shrink-0 flex gap-1">
                          {branches.map((branch) => (
                            <div
                              key={branch.id}
                              className="p-2 rounded-lg bg-gray-100"
                              title={branch.title}
                            >
                              {branch.branchType === 'remedial' ? (
                                <RotateCcw className="w-4 h-4 text-orange-600" />
                              ) : branch.branchType === 'advanced' ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <GitBranch className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Connection Line */}
                {index < pathData.coursePath.nodes.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-0.5 h-4 bg-gray-300"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Graph View */}
      {viewMode === 'graph' && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pathData.coursePath.nodes.map((node) => {
                const status = getNodeStatus(node);
                const isClickable = status !== 'locked';

                return (
                  <div
                    key={node.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      status === 'completed'
                        ? 'border-green-500 bg-green-50'
                        : status === 'current'
                        ? 'border-primary bg-primary/5'
                        : status === 'locked'
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-300 bg-white hover:border-primary/50'
                    } ${isClickable ? 'cursor-pointer' : 'opacity-60'}`}
                    onClick={() => isClickable && onNodeClick?.(node)}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(status)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm truncate mb-2">
                          {node.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {node.estimatedTime}m
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${getDifficultyColor(node.difficulty)}`}>
                            L{node.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-muted">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-muted">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-gray-400" />
              <span className="text-muted">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-muted">Locked</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-orange-600" />
              <span className="text-muted">Review Branch</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-muted">Skip Ahead</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
