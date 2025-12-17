'use client';

import { useState } from 'react';
import { Award, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/types';
import { BADGES } from '@/lib/gamification/badges';

interface BadgeDisplayProps {
  earnedBadgeIds: string[];
  showLocked?: boolean;
  compact?: boolean;
}

export default function BadgeDisplay({
  earnedBadgeIds,
  showLocked = true,
  compact = false,
}: BadgeDisplayProps) {
  const [showAll, setShowAll] = useState(false);

  const earnedBadges = BADGES.filter((badge) => earnedBadgeIds.includes(badge.id));
  const lockedBadges = BADGES.filter((badge) => !earnedBadgeIds.includes(badge.id));

  const displayedEarned = showAll ? earnedBadges : earnedBadges.slice(0, 6);
  const displayedLocked = showAll ? lockedBadges : lockedBadges.slice(0, 3);

  const BadgeItem = ({ badge, locked = false }: { badge: Badge; locked?: boolean }) => (
    <div
      className={`
        group relative p-4 rounded-xl border transition-all duration-200
        ${
          locked
            ? 'bg-gray-500/5 border-gray-500/20 hover:border-gray-500/40'
            : 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 hover:border-primary/50 hover:shadow-md'
        }
      `}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Badge Icon */}
        <div
          className={`
            text-4xl p-3 rounded-full
            ${locked ? 'opacity-40 grayscale' : 'animate-bounce-slow'}
          `}
        >
          {locked ? <Lock className="w-8 h-8 text-gray-400" /> : badge.icon}
        </div>

        {/* Badge Info */}
        <div className="space-y-1">
          <h4
            className={`font-semibold text-sm ${
              locked ? 'text-gray-500' : 'text-foreground'
            }`}
          >
            {badge.name}
          </h4>
          <p
            className={`text-xs ${
              locked ? 'text-gray-400' : 'text-muted'
            }`}
          >
            {badge.description}
          </p>
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              locked
                ? 'bg-gray-500/10 text-gray-500'
                : 'bg-primary/20 text-primary'
            }`}
          >
            <Award className="w-3 h-3" />
            {badge.xpReward} XP
          </div>
        </div>
      </div>

      {/* Category Badge */}
      <div className="absolute top-2 right-2">
        <span
          className={`
            text-xs px-2 py-0.5 rounded-full font-medium
            ${getCategoryStyle(badge.category, locked)}
          `}
        >
          {badge.category}
        </span>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Card variant="bordered" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Badges</h3>
          </div>
          <span className="text-sm text-muted">
            {earnedBadges.length} / {BADGES.length}
          </span>
        </div>

        {/* Compact Grid */}
        <div className="flex flex-wrap gap-2">
          {earnedBadges.slice(0, 5).map((badge) => (
            <div
              key={badge.id}
              className="text-2xl p-2 rounded-lg bg-primary/10 hover:scale-110 transition-transform cursor-pointer"
              title={badge.name}
            >
              {badge.icon}
            </div>
          ))}
          {earnedBadges.length > 5 && (
            <div className="text-sm p-2 rounded-lg bg-border flex items-center justify-center text-muted font-medium">
              +{earnedBadges.length - 5}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="bordered" padding="md">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span>Your Badges</span>
            </div>
            <span className="text-sm font-normal text-muted">
              {earnedBadges.length} / {BADGES.length} unlocked
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted uppercase tracking-wide">
                Unlocked
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedEarned.map((badge) => (
                  <BadgeItem key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          {showLocked && lockedBadges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted uppercase tracking-wide">
                Locked
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedLocked.map((badge) => (
                  <BadgeItem key={badge.id} badge={badge} locked />
                ))}
              </div>
            </div>
          )}

          {/* Show More/Less Button */}
          {(earnedBadges.length > 6 || lockedBadges.length > 3) && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 px-4 rounded-lg border border-border hover:bg-border/50 transition-colors text-sm font-medium text-foreground flex items-center justify-center gap-2"
            >
              {showAll ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show All Badges <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryStyle(category: Badge['category'], locked: boolean): string {
  if (locked) {
    return 'bg-gray-500/10 text-gray-500';
  }

  const styles = {
    achievement: 'bg-blue-500/20 text-blue-600',
    streak: 'bg-orange-500/20 text-orange-600',
    mastery: 'bg-purple-500/20 text-purple-600',
    exploration: 'bg-green-500/20 text-green-600',
  };

  return styles[category];
}
