'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookOpen,
  Trophy,
  Target,
  FileText,
  Lightbulb,
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
  correctAnswer: string;
  explanation: string;
}

interface Assessment {
  _id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  type: 'quiz' | 'final' | 'assignment';
  questions: Question[];
  questionCount: number;
  passingScore: number;
  maxScore: number;
  completed: boolean;
  score?: number;
  completedAt?: string;
}

interface StudentAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  earnedPoints: number;
}

export default function AssessmentReviewPage() {
  const params = useParams();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, StudentAnswer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessmentReview();
  }, [assessmentId]);

  const fetchAssessmentReview = async () => {
    try {
      const response = await fetch(`/api/student/assessments/${assessmentId}`);
      const data = await response.json();

      if (data.success && data.data.completed) {
        setAssessment(data.data);
        // Fetch student's answers from the review endpoint if available
        // For now, we'll show the correct answers
      }
    } catch (error) {
      console.error('Failed to fetch assessment review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!assessment || !assessment.completed) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Assessment not completed yet
        </h2>
        <p className="text-muted mb-4">
          Complete the assessment first to review your answers.
        </p>
        <Link href={`/student/assessments/${assessmentId}`}>
          <Button>Take Assessment</Button>
        </Link>
      </div>
    );
  }

  const percentage = assessment.score !== undefined
    ? Math.round((assessment.score / assessment.maxScore) * 100)
    : 0;
  const passed = percentage >= assessment.passingScore;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/student/assessments"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assessments
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{assessment.title}</h1>
        <p className="text-sm text-muted">{assessment.courseTitle}</p>
      </div>

      {/* Score Summary */}
      <Card variant="bordered">
        <CardContent className="py-8">
          <div className="text-center mb-6">
            {passed ? (
              <Trophy className="w-16 h-16 text-warning mx-auto mb-3" />
            ) : (
              <Target className="w-16 h-16 text-primary mx-auto mb-3" />
            )}
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {passed ? 'Assessment Passed!' : 'Keep Learning!'}
            </h2>
            <p className="text-muted">
              {assessment.completedAt &&
                `Completed on ${new Date(assessment.completedAt).toLocaleDateString()}`}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted mb-1">Score</p>
              <p className="text-2xl font-bold text-primary">
                {assessment.score}/{assessment.maxScore}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg ${
              passed ? 'bg-success/10' : 'bg-error/10'
            }`}>
              <p className="text-sm text-muted mb-1">Percentage</p>
              <p className={`text-2xl font-bold ${passed ? 'text-success' : 'text-error'}`}>
                {percentage}%
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/10">
              <p className="text-sm text-muted mb-1">Passing Score</p>
              <p className="text-2xl font-bold text-secondary">
                {assessment.passingScore}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessment.questions.map((question, index) => (
            <div
              key={question.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedQuestion(
                    expandedQuestion === question.id ? null : question.id
                  )
                }
                className="w-full p-4 flex items-center justify-between hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-foreground text-left line-clamp-1">
                    {question.question}
                  </span>
                </div>
                <span className="text-sm text-muted whitespace-nowrap ml-4">
                  {question.points} pts
                </span>
              </button>

              {expandedQuestion === question.id && (
                <div className="p-4 border-t border-border bg-surface-secondary space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">Question:</p>
                    <p className="text-foreground">{question.question}</p>
                  </div>

                  {question.type === 'mcq' && question.options.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted mb-2">Options:</p>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isCorrect = option === question.correctAnswer;
                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-2 p-3 rounded-lg ${
                                isCorrect
                                  ? 'bg-success/10 border border-success/30'
                                  : 'bg-surface border border-border'
                              }`}
                            >
                              {isCorrect && (
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              )}
                              <span className={isCorrect ? 'text-success font-medium' : 'text-foreground'}>
                                {option}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                    <p className="text-sm font-medium text-success mb-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Correct Answer
                    </p>
                    <p className="text-foreground">{question.correctAnswer}</p>
                  </div>

                  {question.explanation && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-sm font-medium text-primary mb-1 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Explanation
                      </p>
                      <p className="text-foreground text-sm">{question.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Link href="/student/assessments">
          <Button variant="outline">Back to Assessments</Button>
        </Link>
        <Link href={`/student/learn/${assessment.courseId}`}>
          <Button>
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Learning
          </Button>
        </Link>
      </div>
    </div>
  );
}
