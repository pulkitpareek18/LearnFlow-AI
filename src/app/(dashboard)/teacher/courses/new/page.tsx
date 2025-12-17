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
  Code2,
  Github,
  Upload,
  X,
  Settings,
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
import { TeacherInstructions, CodeResource, ProgrammingLanguage } from '@/types';

const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

type CourseInput = z.infer<typeof courseSchema>;

type Step = 'details' | 'upload' | 'instructions' | 'generate' | 'complete';

const PROGRAMMING_LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
];

const CODE_QUESTION_TYPES = [
  { value: 'implementation', label: 'Implementation (Write from scratch)' },
  { value: 'debugging', label: 'Debugging (Find and fix bugs)' },
  { value: 'completion', label: 'Completion (Complete partial code)' },
  { value: 'review', label: 'Review (Answer questions about code)' },
];

export default function NewCoursePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Teacher instructions state
  const [teacherInstructions, setTeacherInstructions] = useState<TeacherInstructions>({
    generalInstructions: '',
    includeCodeQuestions: false,
    codeQuestionTypes: ['implementation', 'completion'],
    preferredLanguages: ['javascript', 'python'],
    difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
    focusAreas: [],
    excludeTopics: [],
    assessmentPreferences: {
      includeQuizzes: true,
      includeCodingChallenges: false,
      includeReflections: true,
    },
  });

  // Code resources state
  const [codeResources, setCodeResources] = useState<CodeResource[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);

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
    { id: 'instructions', label: 'AI Instructions', icon: Settings },
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

  const handleAddGithubResource = async () => {
    if (!githubUrl.trim() || !courseId) return;

    setIsAddingResource(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/code-resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'github_file',
          url: githubUrl,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add code resource');
      }

      setCodeResources([...codeResources, result.data]);
      setGithubUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add code resource');
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    if (!courseId) return;

    try {
      await fetch(`/api/courses/${courseId}/code-resources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });

      setCodeResources(codeResources.filter((r) => r.id !== resourceId));
    } catch (err) {
      console.error('Failed to remove resource:', err);
    }
  };

  const handleGenerate = async () => {
    if (!courseId) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactiveMode: true,
          interactionFrequency: 'medium',
          teacherInstructions,
        }),
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
                  onClick={() => setCurrentStep('instructions')}
                  disabled={!pdfUrl}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'instructions' && (
          <>
            <CardHeader>
              <CardTitle>AI Generation Instructions</CardTitle>
              <CardDescription>
                Customize how AI generates your course content and add code resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Instructions */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Custom Instructions for AI
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-input-placeholder"
                  rows={4}
                  placeholder="Add any specific instructions for how the AI should generate your course content. For example: 'Focus on practical examples', 'Include more exercises after each concept', 'Use simple language for beginners'..."
                  value={teacherInstructions.generalInstructions || ''}
                  onChange={(e) =>
                    setTeacherInstructions({
                      ...teacherInstructions,
                      generalInstructions: e.target.value,
                    })
                  }
                />
              </div>

              {/* Code Questions Toggle */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">
                      Include Coding Exercises
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={teacherInstructions.includeCodeQuestions}
                      onChange={(e) =>
                        setTeacherInstructions({
                          ...teacherInstructions,
                          includeCodeQuestions: e.target.checked,
                          assessmentPreferences: {
                            ...teacherInstructions.assessmentPreferences!,
                            includeCodingChallenges: e.target.checked,
                          },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {teacherInstructions.includeCodeQuestions && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    {/* Programming Languages */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Programming Languages
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROGRAMMING_LANGUAGES.map((lang) => (
                          <button
                            key={lang.value}
                            type="button"
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                              teacherInstructions.preferredLanguages?.includes(lang.value)
                                ? 'bg-primary text-white border-primary'
                                : 'bg-surface border-border text-foreground hover:border-primary'
                            }`}
                            onClick={() => {
                              const current = teacherInstructions.preferredLanguages || [];
                              if (current.includes(lang.value)) {
                                setTeacherInstructions({
                                  ...teacherInstructions,
                                  preferredLanguages: current.filter((l) => l !== lang.value),
                                });
                              } else {
                                setTeacherInstructions({
                                  ...teacherInstructions,
                                  preferredLanguages: [...current, lang.value],
                                });
                              }
                            }}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Types */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Question Types
                      </label>
                      <div className="space-y-2">
                        {CODE_QUESTION_TYPES.map((type) => (
                          <label key={type.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded border-border text-primary focus:ring-primary"
                              checked={teacherInstructions.codeQuestionTypes?.includes(type.value as any)}
                              onChange={(e) => {
                                const current = teacherInstructions.codeQuestionTypes || [];
                                if (e.target.checked) {
                                  setTeacherInstructions({
                                    ...teacherInstructions,
                                    codeQuestionTypes: [...current, type.value as any],
                                  });
                                } else {
                                  setTeacherInstructions({
                                    ...teacherInstructions,
                                    codeQuestionTypes: current.filter((t) => t !== type.value),
                                  });
                                }
                              }}
                            />
                            <span className="text-sm text-foreground">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* GitHub Code Resources */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Github className="w-4 h-4 inline mr-1" />
                        Add Code from GitHub
                      </label>
                      <p className="text-xs text-muted mb-2">
                        Add GitHub file URLs to generate relevant coding exercises
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-4 py-2 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://github.com/user/repo/blob/main/file.js"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                        />
                        <Button
                          type="button"
                          onClick={handleAddGithubResource}
                          disabled={!githubUrl.trim() || isAddingResource}
                        >
                          {isAddingResource ? 'Adding...' : 'Add'}
                        </Button>
                      </div>

                      {/* Added Resources */}
                      {codeResources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {codeResources.map((resource) => (
                            <div
                              key={resource.id}
                              className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-primary" />
                                <span className="text-sm text-foreground truncate max-w-[250px]">
                                  {resource.fileName}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                  {resource.language}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveResource(resource.id)}
                                className="text-muted hover:text-error"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Difficulty Distribution */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Difficulty Distribution
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-muted">Easy</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full px-3 py-1.5 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
                            value={teacherInstructions.difficultyDistribution?.easy || 30}
                            onChange={(e) =>
                              setTeacherInstructions({
                                ...teacherInstructions,
                                difficultyDistribution: {
                                  ...teacherInstructions.difficultyDistribution!,
                                  easy: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted">Medium</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full px-3 py-1.5 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
                            value={teacherInstructions.difficultyDistribution?.medium || 50}
                            onChange={(e) =>
                              setTeacherInstructions({
                                ...teacherInstructions,
                                difficultyDistribution: {
                                  ...teacherInstructions.difficultyDistribution!,
                                  medium: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted">Hard</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full px-3 py-1.5 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center"
                            value={teacherInstructions.difficultyDistribution?.hard || 20}
                            onChange={(e) =>
                              setTeacherInstructions({
                                ...teacherInstructions,
                                difficultyDistribution: {
                                  ...teacherInstructions.difficultyDistribution!,
                                  hard: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted mt-1">Percentages should add up to 100%</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('upload')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep('generate')}>
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
                  onClick={() => setCurrentStep('instructions')}
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
