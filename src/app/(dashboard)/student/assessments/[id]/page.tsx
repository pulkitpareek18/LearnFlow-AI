'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@/components/ui';

interface Question {
  id: string;
  index: number;
  question: string;
  type: 'mcq' | 'short' | 'long' | 'interactive';
  options: string[];
  points: number;
  difficulty: number;
}

interface Assessment {
  _id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  type: 'quiz' | 'final' | 'assignment';
  questions: Question[];
  questionCount: number;
  timeLimit: number;
  passingScore: number;
  maxScore: number;
  completed: boolean;
  score?: number;
}

interface SubmissionResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  xpEarned: number;
  results: Array<{
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    earnedPoints: number;
    explanation: string;
  }>;
}

export default function TakeAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  // Timer effect
  useEffect(() => {
    if (!assessment || assessment.timeLimit === 0 || result) return;

    setTimeRemaining(assessment.timeLimit * 60);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment, result]);

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}`);
      const data = await response.json();

      if (data.success) {
        if (data.data.completed) {
          // Redirect to review page if already completed
          router.push(`/student/assessments/${assessmentId}/review`);
          return;
        }
        setAssessment(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!assessment || isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await fetch(`/api/student/assessments/${assessmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [assessment, answers, assessmentId, isSubmitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progress = assessment
    ? Math.round((answeredCount / assessment.questionCount) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Assessment not found
        </h2>
        <Link href="/student/assessments">
          <Button>Back to Assessments</Button>
        </Link>
      </div>
    );
  }

  // Show results after submission
  if (result) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card variant="bordered">
          <CardContent className="text-center py-12">
            {result.passed ? (
              <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-error mx-auto mb-4" />
            )}
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {result.passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-muted mb-6">
              {result.passed
                ? 'You have successfully passed the assessment.'
                : `You need ${result.passingScore}% to pass.`}
            </p>

            <div className="grid sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="text-sm text-muted">Score</p>
                <p className="text-2xl font-bold text-primary">
                  {result.score}/{result.maxScore}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/10">
                <p className="text-sm text-muted">Percentage</p>
                <p className="text-2xl font-bold text-secondary">
                  {result.percentage}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <p className="text-sm text-muted">XP Earned</p>
                <p className="text-2xl font-bold text-warning">
                  +{result.xpEarned}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link href={`/student/assessments/${assessmentId}/review`}>
                <Button>Review Answers</Button>
              </Link>
              <Link href="/student/assessments">
                <Button variant="outline">Back to Assessments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = assessment.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/student/assessments"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Assessment
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{assessment.title}</h1>
          <p className="text-sm text-muted">{assessment.courseTitle}</p>
        </div>

        {/* Timer */}
        {assessment.timeLimit > 0 && timeRemaining !== null && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 60
                ? 'bg-error/10 text-error animate-pulse'
                : timeRemaining < 300
                ? 'bg-warning/10 text-warning'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <Card variant="bordered">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Progress</span>
            <span className="text-sm font-medium text-foreground">
              {answeredCount} / {assessment.questionCount} answered
            </span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2">
        {assessment.questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
              index === currentQuestion
                ? 'bg-primary text-white'
                : answers[q.id]
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-border text-foreground hover:bg-border/80'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      <Card variant="bordered">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question {currentQuestion + 1}</CardTitle>
            <span className="text-sm text-muted">{currentQ.points} points</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-foreground">{currentQ.question}</p>

          {currentQ.type === 'mcq' && currentQ.options.length > 0 ? (
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    answers[currentQ.id] === option
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQ.id}`}
                    value={option}
                    checked={answers[currentQ.id] === option}
                    onChange={() => handleAnswerChange(currentQ.id, option)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-foreground">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
              placeholder="Type your answer here..."
              rows={currentQ.type === 'long' ? 6 : 3}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestion < assessment.questionCount - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestion((prev) =>
                    Math.min(assessment.questionCount - 1, prev + 1)
                  )
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirmSubmit(true)}>
                <Send className="w-4 h-4 mr-2" />
                Submit Assessment
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card variant="bordered" className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Submit Assessment?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted">
                You have answered {answeredCount} out of {assessment.questionCount}{' '}
                questions.
              </p>
              {answeredCount < assessment.questionCount && (
                <p className="text-warning text-sm">
                  Warning: You have {assessment.questionCount - answeredCount}{' '}
                  unanswered questions.
                </p>
              )}
              <p className="text-sm text-muted">
                Once submitted, you cannot change your answers.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmSubmit(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
