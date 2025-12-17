'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Spinner,
} from '@/components/ui';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

type CourseInput = z.infer<typeof courseSchema>;

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch course');
      }

      reset({
        title: result.data.title,
        description: result.data.description,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CourseInput) => {
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update course');
      }

      setSuccessMessage('Course updated successfully!');
      setTimeout(() => {
        router.push(`/teacher/courses/${courseId}`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/teacher/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Edit Course</h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error text-error">
          {error}
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success text-success">
          {successMessage}
        </div>
      )}

      <Card variant="bordered">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>
            Update your course information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Course Title"
              placeholder="e.g., Introduction to Machine Learning"
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-input-placeholder"
                rows={4}
                placeholder="Describe what students will learn in this course..."
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-error">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Link href={`/teacher/courses/${courseId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
