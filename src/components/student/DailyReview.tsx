'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui';
import { ReviewItem, ReviewQuality } from '@/types';

interface DailyReviewProps {
  courseId?: string; // Optional: filter by course
  onComplete?: () => void;
}

interface ReviewStats {
  totalItems: number;
  dueItems: number;
  reviewedToday: number;
  masteredItems: number;
  masteryPercentage: number;
  accuracy: number;
}

export default function DailyReview({ courseId, onComplete }: DailyReviewProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    completed: 0,
    correct: 0,
  });
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());

  useEffect(() => {
    fetchReviewItems();
    fetchReviewStats();
  }, [courseId]);

  const fetchReviewItems = async () => {
    try {
      setIsLoading(true);
      const url = courseId
        ? `/api/review?courseId=${courseId}&limit=20`
        : '/api/review?limit=20';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data.items) {
        setItems(result.data.items);
        setSessionStats({
          total: result.data.items.length,
          completed: 0,
          correct: 0,
        });
        setStartTime(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch review items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const url = courseId
        ? `/api/review?courseId=${courseId}&statsOnly=true`
        : '/api/review?statsOnly=true';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setReviewStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
    }
  };

  const handleReview = async (quality: ReviewQuality) => {
    if (isSubmitting || currentIndex >= items.length) return;

    try {
      setIsSubmitting(true);
      const currentItem = items[currentIndex];
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: currentItem.id,
          quality,
          timeSpent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update session stats
        setSessionStats((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        }));

        // Move to next item
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setShowAnswer(false);
          setStartTime(new Date());
        } else {
          // Session complete
          if (onComplete) onComplete();
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = items[currentIndex];
  const isComplete = sessionStats.completed >= sessionStats.total && sessionStats.total > 0;
  const progressPercentage =
    sessionStats.total > 0 ? (sessionStats.completed / sessionStats.total) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <Card variant="bordered">
        <CardContent className="flex justify-center py-12">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  // No items to review
  if (!isLoading && items.length === 0) {
    return (
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Daily Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              All Caught Up!
            </h3>
            <p className="text-muted mb-6">
              You have no reviews due today. Great job staying on track!
            </p>
            {reviewStats && (
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted">Mastered</p>
                  <p className="text-2xl font-bold text-primary">
                    {reviewStats.masteredItems}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-success/10">
                  <p className="text-sm text-muted">Accuracy</p>
                  <p className="text-2xl font-bold text-success">
                    {reviewStats.accuracy}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Session complete
  if (isComplete) {
    const accuracy =
      sessionStats.total > 0
        ? Math.round((sessionStats.correct / sessionStats.total) * 100)
        : 0;

    return (
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" />
            Review Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-20 h-20 text-warning mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Excellent Work!
            </h3>
            <p className="text-muted mb-6">
              You completed {sessionStats.total} review{sessionStats.total !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted">Completed</p>
                <p className="text-3xl font-bold text-primary">{sessionStats.completed}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10">
                <p className="text-sm text-muted">Accuracy</p>
                <p className="text-3xl font-bold text-success">{accuracy}%</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setCurrentIndex(0);
                setSessionStats({ total: 0, completed: 0, correct: 0 });
                fetchReviewItems();
              }}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Review More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active review session
  return (
    <Card variant="bordered">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Daily Review
          </CardTitle>
          <div className="text-sm text-muted">
            {sessionStats.completed + 1} / {sessionStats.total}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {currentItem && (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
              <p className="text-sm text-muted mb-2">Question</p>
              <p className="text-lg font-medium text-foreground">
                {currentItem.question}
              </p>
            </div>

            {/* Show/Hide Answer Button */}
            {!showAnswer && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAnswer(true)}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                Show Answer
              </Button>
            )}

            {/* Answer Card */}
            {showAnswer && (
              <div className="space-y-6">
                <div className="p-6 rounded-lg bg-success/5 border-2 border-success/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted">Answer</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAnswer(false)}
                    >
                      <EyeOff className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    {currentItem.answer}
                  </p>
                </div>

                {/* Performance Info */}
                <div className="flex items-center justify-center gap-4 text-sm text-muted">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span>{currentItem.correctCount} correct</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-error" />
                    <span>{currentItem.incorrectCount} incorrect</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Rep: {currentItem.repetitions}</span>
                  </div>
                </div>

                {/* Rating Buttons */}
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium text-foreground">
                    How well did you remember this?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="danger"
                      onClick={() => handleReview(2)}
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReview(3)}
                      disabled={isSubmitting}
                      className="border-warning text-warning hover:bg-warning hover:text-white"
                    >
                      Hard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReview(4)}
                      disabled={isSubmitting}
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      Good
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleReview(5)}
                      disabled={isSubmitting}
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Easy
                    </Button>
                  </div>
                  <p className="text-center text-xs text-muted">
                    Your answer determines when you will see this again
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
