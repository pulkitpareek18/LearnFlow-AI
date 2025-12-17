'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BookOpen,
  Trophy,
  Clock,
  Target,
  Flame,
  GraduationCap,
  ArrowRight,
  BarChart3,
  Play,
  Brain,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui';
import DailyReview from '@/components/student/DailyReview';
import XPProgressBar from '@/components/student/XPProgressBar';
import StreakCounter from '@/components/student/StreakCounter';
import BadgeDisplay from '@/components/student/BadgeDisplay';
import DailyChallenge from '@/components/student/DailyChallenge';

interface EnrolledCourse {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    teacherId: {
      name: string;
    };
  };
  progress: number;
  enrolledAt: string;
}

interface GamificationData {
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  badges: string[];
  dailyChallengeCompleted: boolean;
  weeklyGoal: {
    target: number;
    current: number;
    type: 'modules' | 'xp' | 'time';
  };
}

interface AnalyticsData {
  overallStats: {
    totalCourses: number;
    completedCourses: number;
    activeCourses: number;
    totalModulesCompleted: number;
    totalTimeSpent: number;
    overallAccuracy: number;
    currentStreak: number;
    longestStreak: number;
    totalXP: number;
    currentLevel: number;
  };
  recentActivities: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: Date;
  }>;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
    fetchGamification();
    fetchAnalytics();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await fetch('/api/enrollments');
      const result = await response.json();
      if (result.success) {
        // Filter out enrollments where course was deleted
        const validEnrollments = (result.data || []).filter(
          (e: EnrolledCourse) => e.courseId !== null && e.courseId !== undefined
        );
        setEnrollments(validEnrollments);
      }
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGamification = async () => {
    try {
      const response = await fetch('/api/gamification');
      const result = await response.json();
      if (result.success && result.data) {
        setGamification(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch gamification data:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/student/analytics');
      const result = await response.json();
      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const completedCourses = analytics?.overallStats?.completedCourses ?? enrollments.filter(e => e.progress >= 100).length;
  const totalXP = analytics?.overallStats?.totalXP ?? gamification?.totalXP ?? 0;
  const totalModulesCompleted = analytics?.overallStats?.totalModulesCompleted ?? 0;
  const overallAccuracy = analytics?.overallStats?.overallAccuracy ?? 0;

  const stats = [
    {
      title: 'Enrolled Courses',
      value: (analytics?.overallStats?.totalCourses ?? enrollments.length).toString(),
      icon: BookOpen,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Modules Done',
      value: totalModulesCompleted.toString(),
      icon: Trophy,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total XP',
      value: totalXP.toLocaleString(),
      icon: Zap,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Accuracy',
      value: `${overallAccuracy}%`,
      icon: Target,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted mt-1">
            Continue your learning journey
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/student/analytics">
            <Button variant="outline" leftIcon={<TrendingUp className="w-5 h-5" />}>
              Analytics
            </Button>
          </Link>
          <Link href="/student/browse">
            <Button leftIcon={<GraduationCap className="w-5 h-5" />}>
              Browse Courses
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} variant="bordered">
            <CardContent className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gamification Section */}
      {gamification && (
        <div className="grid lg:grid-cols-2 gap-6">
          <XPProgressBar
            totalXP={gamification.totalXP}
            level={gamification.level}
            animated={true}
            showDetails={true}
          />
          <StreakCounter
            currentStreak={gamification.currentStreak}
            longestStreak={gamification.longestStreak}
            lastActivityDate={new Date(gamification.lastActivityDate)}
          />
        </div>
      )}

      {/* Daily Challenge */}
      <DailyChallenge onComplete={fetchGamification} />

      {/* Daily Review Section */}
      <DailyReview onComplete={() => {
        fetchEnrollments();
        fetchGamification();
      }} />

      {/* Continue Learning Section */}
      <Card variant="bordered">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Continue Learning</CardTitle>
          <Link
            href="/student/courses"
            className="text-sm text-primary hover:underline"
          >
            View all courses
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.slice(0, 3).map((enrollment) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {enrollment.courseId?.title || 'Course'}
                      </h3>
                      <p className="text-sm text-muted">
                        By {enrollment.courseId?.teacherId?.name || 'Teacher'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">
                          {enrollment.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/student/learn/${enrollment.courseId?._id}`}>
                    <Button size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Continue
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No courses enrolled yet
              </h3>
              <p className="text-muted mb-4">
                Browse available courses and start learning today
              </p>
              <Link href="/student/browse">
                <Button>
                  Browse Courses
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Badges */}
        {gamification && gamification.badges.length > 0 ? (
          <BadgeDisplay
            earnedBadgeIds={gamification.badges}
            showLocked={false}
            compact={true}
          />
        ) : (
          <Card variant="bordered">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-sm text-muted">Complete tasks to earn badges</p>
                <Link href="/student/achievements">
                  <Button variant="outline" className="mt-4" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Goal Progress */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Weekly Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gamification?.weeklyGoal ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {gamification.weeklyGoal.current} / {gamification.weeklyGoal.target}
                  </p>
                  <p className="text-sm text-muted capitalize">
                    {gamification.weeklyGoal.type} this week
                  </p>
                </div>
                <div className="h-3 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (gamification.weeklyGoal.current / gamification.weeklyGoal.target) * 100)}%`
                    }}
                  />
                </div>
                {gamification.weeklyGoal.current >= gamification.weeklyGoal.target && (
                  <p className="text-center text-sm text-success font-medium">
                    Goal completed!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted">No weekly goal set</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Current Level</span>
                <span className="font-medium text-primary">
                  Level {analytics?.overallStats?.currentLevel ?? gamification?.level ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Accuracy</span>
                <span className="font-medium text-success">
                  {analytics?.overallStats?.overallAccuracy ?? 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Learning Streak</span>
                <span className="font-medium text-warning flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {analytics?.overallStats?.currentStreak ?? gamification?.currentStreak ?? 0} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Badges Earned</span>
                <span className="font-medium">{gamification?.badges?.length ?? 0}</span>
              </div>
              <Link href="/student/analytics" className="block">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Full Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
