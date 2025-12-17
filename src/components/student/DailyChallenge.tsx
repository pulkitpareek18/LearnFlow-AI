'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, BookOpen, Timer } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DailyChallenge as DailyChallengeType } from '@/types';

interface DailyChallengeProps {
  courseId?: string;
  onComplete?: () => void;
}

export default function DailyChallenge({ courseId, onComplete }: DailyChallengeProps) {
  const [challenge, setChallenge] = useState<DailyChallengeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [courseId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const url = courseId
        ? `/api/gamification/daily-challenge?courseId=${courseId}`
        : '/api/gamification/daily-challenge';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setChallenge(data.data);
      }
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async () => {
    if (!challenge || challenge.completed) return;

    try {
      setCompleting(true);
      const response = await fetch('/api/gamification/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (data.success) {
        setChallenge({ ...challenge, completed: true });
        onComplete?.();
      }
    } catch (error) {
      console.error('Error completing daily challenge:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <Card variant="bordered" padding="md">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-border rounded w-1/3"></div>
          <div className="h-4 bg-border rounded w-2/3"></div>
          <div className="h-10 bg-border rounded"></div>
        </div>
      </Card>
    );
  }

  if (!challenge) {
    return null;
  }

  const getChallengeIcon = () => {
    switch (challenge.type) {
      case 'quiz':
        return <Target className="w-5 h-5" />;
      case 'review':
        return <BookOpen className="w-5 h-5" />;
      case 'time_goal':
        return <Timer className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getChallengeTitle = () => {
    switch (challenge.type) {
      case 'quiz':
        return 'Quiz Master';
      case 'review':
        return 'Review Champion';
      case 'time_goal':
        return 'Study Session';
      default:
        return 'Daily Challenge';
    }
  };

  const getChallengeDescription = () => {
    switch (challenge.type) {
      case 'quiz':
        return `Complete ${challenge.requirement} quiz questions today`;
      case 'review':
        return `Review ${challenge.requirement} concepts today`;
      case 'time_goal':
        return `Study for ${challenge.requirement} minutes today`;
      default:
        return 'Complete today\'s challenge';
    }
  };

  return (
    <Card
      variant="bordered"
      padding="md"
      className={challenge.completed ? 'border-success bg-success/5' : 'border-primary bg-primary/5'}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                challenge.completed ? 'bg-success/20' : 'bg-primary/20'
              }`}
            >
              {challenge.completed ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                getChallengeIcon()
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">
                {getChallengeTitle()}
              </h3>
              <p className="text-xs text-muted">Daily Challenge</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-semibold text-yellow-600">
                +{challenge.xpReward} XP
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Challenge Description */}
          <p className="text-sm text-foreground">
            {getChallengeDescription()}
          </p>

          {/* Status */}
          {challenge.completed ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
              <CheckCircle className="w-5 h-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success">Challenge Completed!</p>
                <p className="text-xs text-success/80">
                  You earned {challenge.xpReward} XP
                </p>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={completeChallenge}
              isLoading={completing}
              className="w-full"
            >
              Mark as Complete
            </Button>
          )}

          {/* Time Remaining */}
          {!challenge.completed && (
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock className="w-3 h-3" />
              <span>Resets at midnight</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
