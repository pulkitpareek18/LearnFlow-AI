'use client';

import { useEffect, useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import Card from '@/components/ui/Card';
import { calculateLevel, getXPForNextLevel, getLevelProgress } from '@/lib/gamification';

interface XPProgressBarProps {
  totalXP: number;
  level: number;
  animated?: boolean;
  showDetails?: boolean;
}

export default function XPProgressBar({
  totalXP,
  level,
  animated = true,
  showDetails = true,
}: XPProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const nextLevelXP = getXPForNextLevel(level);
  const currentLevelXP = level * level * 100;
  const progressToNextLevel = getLevelProgress(totalXP, level);
  const xpForNext = nextLevelXP - totalXP;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setProgress(progressToNextLevel), 100);
      return () => clearTimeout(timer);
    } else {
      setProgress(progressToNextLevel);
    }
  }, [progressToNextLevel, animated]);

  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Level {level}</h3>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                  {totalXP.toLocaleString()} XP
                </span>
              </div>
              {showDetails && (
                <p className="text-xs text-muted">
                  {xpForNext.toLocaleString()} XP to next level
                </p>
              )}
            </div>
          </div>
          <Zap className="w-6 h-6 text-yellow-500" />
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-3 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out ${
                animated ? 'animate-pulse' : ''
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {showDetails && (
            <div className="flex justify-between text-xs text-muted">
              <span>{currentLevelXP.toLocaleString()} XP</span>
              <span className="font-medium">{progressToNextLevel.toFixed(0)}%</span>
              <span>{nextLevelXP.toLocaleString()} XP</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
