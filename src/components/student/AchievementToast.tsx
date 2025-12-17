'use client';

import { useEffect, useState } from 'react';
import { Trophy, Award, Zap, Star, X } from 'lucide-react';
import { Badge } from '@/types';

interface AchievementToastProps {
  type: 'badge' | 'level_up' | 'xp';
  badge?: Badge;
  newLevel?: number;
  xpEarned?: number;
  onClose?: () => void;
  autoHideDuration?: number;
}

export default function AchievementToast({
  type,
  badge,
  newLevel,
  xpEarned,
  onClose,
  autoHideDuration = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto-hide timer
    const hideTimer = setTimeout(() => {
      handleClose();
    }, autoHideDuration);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [autoHideDuration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getContent = () => {
    switch (type) {
      case 'badge':
        return badge ? (
          <>
            <div className="flex-shrink-0">
              <div className="text-5xl animate-bounce">{badge.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-foreground">Badge Unlocked!</h3>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {badge.name}
              </p>
              <p className="text-xs text-muted">{badge.description}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                <Zap className="w-3 h-3" />
                +{badge.xpReward} XP
              </div>
            </div>
          </>
        ) : null;

      case 'level_up':
        return newLevel ? (
          <>
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Trophy className="w-12 h-12 text-yellow-500 opacity-75" />
                </div>
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-foreground">Level Up!</h3>
              </div>
              <p className="text-2xl font-bold text-primary mb-1">
                Level {newLevel}
              </p>
              <p className="text-xs text-muted">
                You're getting stronger! Keep learning to unlock more rewards.
              </p>
            </div>
          </>
        ) : null;

      case 'xp':
        return xpEarned ? (
          <>
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-primary/20">
                <Zap className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground mb-1">XP Earned!</h3>
              <p className="text-xl font-bold text-primary">
                +{xpEarned} XP
              </p>
            </div>
          </>
        ) : null;

      default:
        return null;
    }
  };

  const getBackgroundGradient = () => {
    switch (type) {
      case 'badge':
        return 'from-purple-500/20 to-pink-500/20';
      case 'level_up':
        return 'from-yellow-500/20 to-orange-500/20';
      case 'xp':
        return 'from-blue-500/20 to-cyan-500/20';
      default:
        return 'from-primary/20 to-secondary/20';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          relative overflow-hidden
          bg-card rounded-xl shadow-2xl border-2 border-primary/50
          backdrop-blur-sm
        `}
      >
        {/* Animated Background */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()}
            animate-gradient-shift
          `}
        />

        {/* Content */}
        <div className="relative p-4 flex items-start gap-4">
          {getContent()}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-border/50 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Animated Border Effect */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-shimmer" />
      </div>

      {/* Confetti Effect for Badge/Level Up */}
      {(type === 'badge' || type === 'level_up') && isVisible && !isExiting && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${50 + (Math.random() - 0.5) * 100}%`,
                top: '50%',
                backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347'][
                  Math.floor(Math.random() * 4)
                ],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Multiple Achievement Toast Manager
interface AchievementData {
  id: string;
  type: 'badge' | 'level_up' | 'xp';
  badge?: Badge;
  newLevel?: number;
  xpEarned?: number;
}

export function AchievementToastContainer({
  achievements,
  onDismiss,
}: {
  achievements: AchievementData[];
  onDismiss: (id: string) => void;
}) {
  return (
    <>
      {achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{
            position: 'fixed',
            top: `${4 + index * 140}px`,
            right: '16px',
            zIndex: 50 - index,
          }}
        >
          <AchievementToast
            type={achievement.type}
            badge={achievement.badge}
            newLevel={achievement.newLevel}
            xpEarned={achievement.xpEarned}
            onClose={() => onDismiss(achievement.id)}
            autoHideDuration={5000 + index * 1000}
          />
        </div>
      ))}
    </>
  );
}
