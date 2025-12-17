'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  BookOpen,
  Clock,
  Search,
  User,
  GraduationCap,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Spinner,
} from '@/components/ui';
import Navbar from '@/components/layouts/Navbar';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  teacherId: {
    _id: string;
    name: string;
  };
  chapters: { _id: string }[];
  createdAt: string;
}

export default function PublicCoursesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses?published=true');
      const result = await response.json();

      if (result.success) {
        setCourses(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Explore Courses
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Discover AI-powered courses created by expert teachers. Learn at your own pace with personalized tutoring.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spinner size="lg" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link key={course._id} href={`/courses/${course._id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary/50" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-muted text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{course.teacherId?.name || 'Teacher'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.chapters?.length || 0} chapters</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <GraduationCap className="w-20 h-20 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              {searchQuery ? 'No courses found' : 'No courses available yet'}
            </h3>
            <p className="text-muted mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back soon for new courses'}
            </p>
            {session?.user?.role === 'teacher' && (
              <Link href="/teacher/courses/new">
                <Button>Create a Course</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
