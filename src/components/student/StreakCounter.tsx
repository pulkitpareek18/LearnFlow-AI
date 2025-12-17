'use client';

import { Flame, Award } from 'lucide-react';
import Card from '@/components/ui/Card';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

export default function StreakCounter({
  currentStreak,
  longestStreak,
  lastActivityDate,
}: StreakCounterProps) {
  const isActive = (() => {
    const today = new Date();
    const lastActivity = new Date(lastActivityDate);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastActivityStart = new Date(
      lastActivity.getFullYear(),
      lastActivity.getMonth(),
      lastActivity.getDate()
    );
    const daysDiff = Math.floor(
      (todayStart.getTime() - lastActivityStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 1;
  })();

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-orange-500';
    if (streak >= 14) return 'text-yellow-500';
    if (streak >= 7) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your learning streak today!';
    if (streak === 1) return 'Great start! Keep it going!';
    if (streak < 7) return 'Building momentum!';
    if (streak < 14) return 'On fire! Keep learning!';
    if (streak < 30) return 'Amazing dedication!';
    return 'Legendary streak!';
  };

  return (
    <Card variant="bordered" padding="md">
      <div className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${
              isActive ? 'bg-orange-500/10' : 'bg-gray-500/10'
            }`}
          >
            <Flame
              className={`w-8 h-8 ${
                isActive ? getStreakColor(currentStreak) : 'text-gray-400'
              }`}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-foreground">
                {currentStreak}
              </h3>
              <span className="text-sm text-muted">day streak</span>
            </div>
            <p className="text-xs text-muted mt-1">{getStreakMessage(currentStreak)}</p>
          </div>
        </div>

        {/* Longest Streak */}
        {longestStreak > 0 && (
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <Award className="w-4 h-4 text-yellow-500" />
            <div className="flex-1">
              <p className="text-xs text-muted">Longest Streak</p>
              <p className="text-sm font-semibold text-foreground">
                {longestStreak} days
              </p>
            </div>
          </div>
        )}

        {/* Streak Status */}
        {!isActive && currentStreak > 0 && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs text-warning font-medium">
              Your streak is about to break! Complete a module today to keep it alive.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
