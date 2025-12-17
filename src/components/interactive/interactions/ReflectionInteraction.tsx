'use client';

import { useState } from 'react';
import { MessageSquare, Send, Lightbulb, Award } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { ReflectionInteraction as ReflectionType } from '@/types';

interface ReflectionInteractionProps {
  interaction: ReflectionType;
  onSubmit: (response: { reflectionText: string }) => Promise<{
    isCorrect?: boolean;
    score: number;
    maxScore: number;
    feedback: string;
    aiFeedback?: string;
  }>;
  disabled?: boolean;
  previousResponse?: { reflectionText: string };
}

export default function ReflectionInteraction({
  interaction,
  onSubmit,
  disabled = false,
  previousResponse,
}: ReflectionInteractionProps) {
  const [text, setText] = useState(previousResponse?.reflectionText || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    feedback: string;
    suggestions?: string[];
    strengthAreas?: string[];
  } | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = interaction.minWords || 30;
  const maxWords = interaction.maxWords || 200;

  const isValidLength = wordCount >= minWords && wordCount <= maxWords;

  const handleSubmit = async () => {
    if (!isValidLength || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const response = await onSubmit({ reflectionText: text });

      // Parse AI feedback if available
      let suggestions: string[] = [];
      let strengthAreas: string[] = [];

      if (response.aiFeedback) {
        try {
          const parsed = JSON.parse(response.aiFeedback);
          suggestions = parsed.suggestions || [];
          strengthAreas = parsed.strengthAreas || [];
        } catch {
          // AI feedback is not in expected format
        }
      }

      setResult({
        score: response.score,
        maxScore: response.maxScore,
        feedback: response.feedback,
        suggestions,
        strengthAreas,
      });
    } catch (error) {
      console.error('Error submitting reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <Card variant="bordered" className="p-6">
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <h4 className="font-semibold text-foreground">Reflection</h4>
        </div>
        <p className="text-foreground ml-7">{interaction.prompt}</p>
      </div>

      {!result ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your reflection here..."
            disabled={disabled}
            className="w-full h-40 p-4 rounded-lg border border-input-border bg-input text-input-text placeholder:text-input-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex justify-between items-center mt-2 mb-4 text-sm">
            <span
              className={`${
                wordCount < minWords
                  ? 'text-warning'
                  : wordCount > maxWords
                  ? 'text-error'
                  : 'text-success'
              }`}
            >
              {wordCount} / {minWords}-{maxWords} words
            </span>
            {wordCount < minWords && (
              <span className="text-muted">
                Write at least {minWords - wordCount} more words
              </span>
            )}
            {wordCount > maxWords && (
              <span className="text-error">
                Remove {wordCount - maxWords} words
              </span>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValidLength || isSubmitting || disabled}
            className="w-full"
          >
            {isSubmitting ? (
              'AI is reviewing your response...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Reflection
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          {/* Submitted response display */}
          <div className="p-4 bg-surface-secondary rounded-lg mb-4">
            <p className="text-sm text-muted mb-2">Your response:</p>
            <p className="text-foreground whitespace-pre-wrap">{text}</p>
          </div>

          {/* Score display */}
          <div className="flex items-center justify-center gap-4 mb-4 p-4 bg-surface-secondary rounded-lg">
            <Award
              className={`w-8 h-8 ${getScoreColor(
                result.score,
                result.maxScore
              )}`}
            />
            <div className="text-center">
              <span
                className={`text-3xl font-bold ${getScoreColor(
                  result.score,
                  result.maxScore
                )}`}
              >
                {result.score}
              </span>
              <span className="text-muted text-lg">/{result.maxScore}</span>
              <p className="text-sm text-muted">points earned</p>
            </div>
          </div>

          {/* Feedback */}
          <div className="p-4 rounded-lg bg-primary/10 mb-4">
            <h5 className="font-semibold text-foreground mb-2">AI Feedback</h5>
            <p className="text-foreground">{result.feedback}</p>
          </div>

          {/* Strength areas */}
          {result.strengthAreas && result.strengthAreas.length > 0 && (
            <div className="p-4 rounded-lg bg-success/10 mb-4">
              <h5 className="font-semibold text-success mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                What you did well
              </h5>
              <ul className="list-disc list-inside text-foreground text-sm space-y-1">
                {result.strengthAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="p-4 rounded-lg bg-warning/10">
              <h5 className="font-semibold text-warning mb-2">
                Suggestions for improvement
              </h5>
              <ul className="list-disc list-inside text-foreground text-sm space-y-1">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="mt-3 text-sm text-muted text-center">
        {interaction.points} points • AI-graded
      </div>
    </Card>
  );
}
