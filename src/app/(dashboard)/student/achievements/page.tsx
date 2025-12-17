'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Star,
  Flame,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  Target,
  Zap,
  Lock,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'completion' | 'engagement';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

const achievementsList: Achievement[] = [
  {
    id: 'first-course',
    title: 'First Steps',
    description: 'Enroll in your first course',
    icon: 'BookOpen',
    category: 'learning',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'first-completion',
    title: 'Course Completer',
    description: 'Complete your first course',
    icon: 'CheckCircle',
    category: 'completion',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: 'Flame',
    category: 'streak',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: 'Flame',
    category: 'streak',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'streak-30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: 'Flame',
    category: 'streak',
    unlocked: false,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'five-modules',
    title: 'Quick Learner',
    description: 'Complete 5 modules',
    icon: 'Zap',
    category: 'learning',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'ten-modules',
    title: 'Knowledge Seeker',
    description: 'Complete 10 modules',
    icon: 'Star',
    category: 'learning',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'first-chat',
    title: 'Curious Mind',
    description: 'Ask your first question to the AI tutor',
    icon: 'Target',
    category: 'engagement',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'time-1h',
    title: 'Dedicated Learner',
    description: 'Spend 1 hour learning',
    icon: 'Clock',
    category: 'engagement',
    unlocked: false,
    progress: 0,
    maxProgress: 60,
  },
  {
    id: 'time-10h',
    title: 'Learning Champion',
    description: 'Spend 10 hours learning',
    icon: 'Award',
    category: 'engagement',
    unlocked: false,
    progress: 0,
    maxProgress: 600,
  },
];

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  CheckCircle,
  Flame,
  Zap,
  Star,
  Target,
  Clock,
  Award,
  Trophy,
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  learning: { bg: 'bg-primary/10', text: 'text-primary' },
  streak: { bg: 'bg-warning/10', text: 'text-warning' },
  completion: { bg: 'bg-success/10', text: 'text-success' },
  engagement: { bg: 'bg-secondary/10', text: 'text-secondary' },
};

export default function StudentAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>(achievementsList);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Simulate loading - in production, fetch from API
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredAchievements = filter === 'all'
    ? achievements
    : filter === 'unlocked'
    ? achievements.filter(a => a.unlocked)
    : achievements.filter(a => a.category === filter);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted mt-1">
          Track your progress and unlock achievements
        </p>
      </div>

      {/* Progress Overview */}
      <Card variant="bordered">
        <CardContent className="flex items-center gap-6 p-6">
          <div className="p-4 rounded-full bg-warning/10">
            <Trophy className="w-10 h-10 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted">Overall Progress</p>
            <p className="text-3xl font-bold text-foreground">
              {unlockedCount} / {totalCount}
            </p>
            <div className="mt-2 w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-warning rounded-full transition-all"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-warning">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </p>
            <p className="text-sm text-muted">Complete</p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'unlocked', label: 'Unlocked' },
          { value: 'learning', label: 'Learning' },
          { value: 'streak', label: 'Streak' },
          { value: 'completion', label: 'Completion' },
          { value: 'engagement', label: 'Engagement' },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item.value
                ? 'bg-primary text-white'
                : 'bg-border text-foreground hover:bg-border/80'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const IconComponent = iconMap[achievement.icon] || Trophy;
          const colors = categoryColors[achievement.category];

          return (
            <Card
              key={achievement.id}
              variant="bordered"
              className={`transition-all ${
                achievement.unlocked ? '' : 'opacity-60'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colors.bg} relative`}>
                    <IconComponent className={`w-6 h-6 ${colors.text}`} />
                    {!achievement.unlocked && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full">
                        <Lock className="w-3 h-3 text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {achievement.description}
                    </p>
                    {achievement.maxProgress && achievement.maxProgress > 1 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors.bg.replace('/10', '')}`}
                            style={{
                              width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-success mt-2">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No achievements found
          </h3>
          <p className="text-muted">
            Try a different filter or keep learning to unlock achievements
          </p>
        </div>
      )}
    </div>
  );
}
