'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import PDFUpload from '@/components/forms/PDFUpload';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

type CourseInput = z.infer<typeof courseSchema>;

type Step = 'details' | 'upload' | 'generate' | 'complete';

export default function NewCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
  });

  const steps = [
    { id: 'details', label: 'Course Details', icon: BookOpen },
    { id: 'upload', label: 'Upload PDF', icon: FileText },
    { id: 'generate', label: 'Generate Content', icon: Sparkles },
    { id: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const getCurrentStepIndex = () => steps.findIndex((s) => s.id === currentStep);

  const handleCreateCourse = async (data: CourseInput) => {
    setError('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create course');
      }

      setCourseId(result.data._id);
      setCurrentStep('upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  };

  const handlePdfUpload = async (url: string) => {
    setPdfUrl(url);

    // Update course with PDF URL
    if (courseId) {
      await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: url }),
      });
    }
  };

  const handleGenerate = async () => {
    if (!courseId) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/generate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate content');
      }

      setCurrentStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkipGenerate = () => {
    setCurrentStep('complete');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/teacher/courses"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Create New Course</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${index <= getCurrentStepIndex()
                    ? 'bg-primary text-white'
                    : 'bg-border text-muted'
                  }
                `}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm hidden sm:block ${
                  index <= getCurrentStepIndex() ? 'text-foreground' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-1 mx-2 ${
                    index < getCurrentStepIndex() ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error text-error">
          {error}
        </div>
      )}

      {/* Step Content */}
      <Card variant="bordered">
        {currentStep === 'details' && (
          <>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Enter the basic information about your course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleCreateCourse)} className="space-y-6">
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

                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSubmitting}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}

        {currentStep === 'upload' && (
          <>
            <CardHeader>
              <CardTitle>Upload Course Material</CardTitle>
              <CardDescription>
                Upload a PDF file to automatically generate course content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PDFUpload
                onUploadComplete={handlePdfUpload}
                currentFile={pdfUrl || undefined}
              />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('details')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep('generate')}
                  disabled={!pdfUrl}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'generate' && (
          <>
            <CardHeader>
              <CardTitle>Generate Course Content</CardTitle>
              <CardDescription>
                Use AI to automatically create chapters, modules, and assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {isGenerating ? 'Generating Content...' : 'Ready to Generate'}
                </h3>
                <p className="text-muted max-w-md mx-auto mb-6">
                  {isGenerating
                    ? 'AI is analyzing your PDF and creating structured course content. This may take a minute...'
                    : 'Click the button below to let AI analyze your PDF and create chapters, modules, and learning content.'}
                </p>

                {!isGenerating && (
                  <div className="space-y-3">
                    <Button onClick={handleGenerate} size="lg">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate with AI
                    </Button>
                    <div>
                      <button
                        onClick={handleSkipGenerate}
                        className="text-sm text-muted hover:text-foreground"
                      >
                        Skip and create manually
                      </button>
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('upload')}
                  disabled={isGenerating}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'complete' && (
          <>
            <CardHeader>
              <CardTitle>Course Created!</CardTitle>
              <CardDescription>
                Your course has been created successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {getValues('title')}
                </h3>
                <p className="text-muted max-w-md mx-auto mb-6">
                  Your course is ready. You can now review and edit the generated content,
                  or publish it for students to enroll.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`/teacher/courses/${courseId}`}>
                    <Button>View Course</Button>
                  </Link>
                  <Link href="/teacher/courses">
                    <Button variant="outline">Go to All Courses</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
