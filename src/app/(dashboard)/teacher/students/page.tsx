'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Search,
  Mail,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface Student {
  _id: string;
  name: string;
  email: string;
  enrolledAt: string;
  courseName: string;
  courseId: string;
  progress: number;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students');
      const result = await response.json();

      if (result.success) {
        setStudents(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueStudents = [...new Set(students.map(s => s.email))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted mt-1">
            View and manage students enrolled in your courses
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Students</p>
              <p className="text-2xl font-bold text-foreground">
                {uniqueStudents}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card variant="bordered">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-secondary/10">
              <BookOpen className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted">Total Enrollments</p>
              <p className="text-2xl font-bold text-foreground">
                {students.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          placeholder="Search students or courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Students List */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Student
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Course
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Enrolled
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={`${student._id}-${student.courseId}-${index}`}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/teacher/students/${student._id}`}
                          className="block hover:text-primary"
                        >
                          <p className="font-medium text-foreground">
                            {student.name}
                          </p>
                          <p className="text-sm text-muted flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {student.email}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/teacher/courses/${student.courseId}`}
                          className="text-primary hover:underline"
                        >
                          {student.courseName}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(student.enrolledAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted">
                            {student.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No students found' : 'No students yet'}
              </h3>
              <p className="text-muted">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Students will appear here when they enroll in your courses'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
