'use client';

import { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, Spinner } from '@/components/ui';
import { AdaptiveRecommendation } from '@/types';

interface AdaptiveRecommendationsProps {
  courseId: string;
  moduleId?: string;
  compact?: boolean;
}

interface RecommendationsData {
  recommendations: AdaptiveRecommendation[];
  adaptiveContent?: {
    additionalExamples?: string[];
    simplifiedExplanation?: string;
    reviewRecommendations?: string[];
    message?: string;
  };
  metrics: {
    accuracy: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    correctStreak: number;
    incorrectStreak: number;
    currentDifficulty: number;
    suggestedDifficulty: number;
  };
  summary: string;
}

export default function AdaptiveRecommendations({
  courseId,
  moduleId,
  compact = false,
}: AdaptiveRecommendationsProps) {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [courseId, moduleId]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const url = moduleId
        ? `/api/adaptive/recommendations?courseId=${courseId}&moduleId=${moduleId}`
        : `/api/adaptive/recommendations?courseId=${courseId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-error" />;
      default:
        return <Minus className="w-4 h-4 text-muted" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'slow_down':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'speed_up':
      case 'challenge':
        return <Zap className="w-5 h-5 text-success" />;
      case 'review':
        return <BookOpen className="w-5 h-5 text-secondary" />;
      case 'extra_examples':
      case 'simplify':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      default:
        return <Lightbulb className="w-5 h-5 text-muted" />;
    }
  };

  if (isLoading) {
    return (
      <Card variant="bordered" className="p-4">
        <div className="flex items-center justify-center">
          <Spinner size="sm" />
          <span className="ml-2 text-muted">Loading recommendations...</span>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return null; // Silently fail if no recommendations
  }

  if (compact) {
    return (
      <Card variant="bordered" className="overflow-hidden">
        <button
          className="w-full p-4 flex items-center justify-between hover:bg-surface-secondary transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              Learning Insights
            </span>
            {data.metrics.accuracy > 0 && (
              <span className="text-sm text-muted ml-2">
                {data.metrics.accuracy}% accuracy
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted" />
          )}
        </button>

        {isExpanded && (
          <CardContent className="pt-0 pb-4 px-4">
            {data.summary && (
              <p className="text-sm text-foreground mb-3">{data.summary}</p>
            )}

            {data.recommendations.length > 0 && (
              <div className="space-y-2">
                {data.recommendations.slice(0, 2).map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    {getRecommendationIcon(rec.type)}
                    <span className="text-foreground">{rec.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card variant="bordered">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-6 h-6 text-primary" />
          <h3 className="font-semibold text-foreground text-lg">
            Learning Insights
          </h3>
        </div>

        {/* Performance Summary */}
        {data.summary && (
          <p className="text-foreground mb-6">{data.summary}</p>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-surface-secondary rounded-lg">
            <div className="text-sm text-muted mb-1">Accuracy</div>
            <div className="text-2xl font-bold text-foreground">
              {data.metrics.accuracy}%
            </div>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg">
            <div className="text-sm text-muted mb-1">Trend</div>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.metrics.recentTrend)}
              <span className="text-lg font-medium text-foreground capitalize">
                {data.metrics.recentTrend}
              </span>
            </div>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg">
            <div className="text-sm text-muted mb-1">Correct Streak</div>
            <div className="text-2xl font-bold text-success">
              {data.metrics.correctStreak}
            </div>
          </div>
          <div className="p-3 bg-surface-secondary rounded-lg">
            <div className="text-sm text-muted mb-1">Difficulty</div>
            <div className="text-2xl font-bold text-foreground">
              {data.metrics.currentDifficulty}/10
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-foreground mb-3">
              Recommendations
            </h4>
            <div className="space-y-3">
              {data.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg"
                >
                  {getRecommendationIcon(rec.type)}
                  <div>
                    <p className="text-foreground">{rec.message}</p>
                    {rec.relatedConceptKeys &&
                      rec.relatedConceptKeys.length > 0 && (
                        <p className="text-sm text-muted mt-1">
                          Related: {rec.relatedConceptKeys.join(', ')}
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adaptive Content */}
        {data.adaptiveContent && (
          <div className="space-y-4">
            {data.adaptiveContent.message && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-foreground">{data.adaptiveContent.message}</p>
              </div>
            )}

            {data.adaptiveContent.simplifiedExplanation && (
              <div className="p-4 bg-secondary/10 rounded-lg">
                <h5 className="font-medium text-foreground mb-2">
                  Simplified Explanation
                </h5>
                <p className="text-foreground text-sm">
                  {data.adaptiveContent.simplifiedExplanation}
                </p>
              </div>
            )}

            {data.adaptiveContent.additionalExamples &&
              data.adaptiveContent.additionalExamples.length > 0 && (
                <div className="p-4 bg-warning/10 rounded-lg">
                  <h5 className="font-medium text-foreground mb-2">
                    Additional Examples
                  </h5>
                  <ul className="list-disc list-inside text-foreground text-sm space-y-1">
                    {data.adaptiveContent.additionalExamples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

            {data.adaptiveContent.reviewRecommendations &&
              data.adaptiveContent.reviewRecommendations.length > 0 && (
                <div className="p-4 bg-error/10 rounded-lg">
                  <h5 className="font-medium text-foreground mb-2">
                    Review Suggestions
                  </h5>
                  <ul className="list-disc list-inside text-foreground text-sm space-y-1">
                    {data.adaptiveContent.reviewRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
