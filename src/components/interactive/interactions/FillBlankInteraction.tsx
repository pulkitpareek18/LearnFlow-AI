'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Edit3 } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { FillBlankInteraction as FillBlankType } from '@/types';

interface FillBlankInteractionProps {
  interaction: FillBlankType;
  onSubmit: (response: { filledAnswers: Record<string, string> }) => Promise<{
    isCorrect: boolean;
    score: number;
    maxScore: number;
    feedback: string;
    correctAnswer?: string;
  }>;
  disabled?: boolean;
  previousResponse?: { filledAnswers: Record<string, string> };
}

export default function FillBlankInteraction({
  interaction,
  onSubmit,
  disabled = false,
  previousResponse,
}: FillBlankInteractionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    previousResponse?.filledAnswers ||
      interaction.blanks.reduce((acc, blank) => ({ ...acc, [blank.id]: '' }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    correctAnswer?: string;
    blankResults?: Record<string, boolean>;
  } | null>(null);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const handleSubmit = async () => {
    if (isSubmitting || disabled) return;

    // Check if all blanks are filled
    const allFilled = interaction.blanks.every(
      (blank) => answers[blank.id]?.trim()
    );
    if (!allFilled) return;

    setIsSubmitting(true);
    try {
      const response = await onSubmit({ filledAnswers: answers });

      // Parse correctAnswer to determine which blanks were correct
      const blankResults: Record<string, boolean> = {};
      if (response.correctAnswer) {
        // The correctAnswer format is "blank_id: answer, blank_id: answer"
        interaction.blanks.forEach((blank) => {
          const userAnswer = answers[blank.id]?.toLowerCase().trim();
          const correctAnswer = blank.correctAnswer.toLowerCase().trim();
          const acceptableAnswers = (blank.acceptableAnswers || []).map((a) =>
            a.toLowerCase().trim()
          );
          blankResults[blank.id] =
            userAnswer === correctAnswer || acceptableAnswers.includes(userAnswer);
        });
      }

      setResult({
        isCorrect: response.isCorrect,
        feedback: response.feedback,
        correctAnswer: response.correctAnswer,
        blankResults,
      });
    } catch (error) {
      console.error('Error submitting fill blank:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHint = (blankId: string) => {
    setShowHints((prev) => ({ ...prev, [blankId]: !prev[blankId] }));
  };

  // Render the text with blanks
  const renderTextWithBlanks = () => {
    let text = interaction.text;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all {{blank_id}} patterns
    const blankPattern = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = blankPattern.exec(interaction.text)) !== null) {
      // Add text before the blank
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      const blankId = match[1];
      const blank = interaction.blanks.find((b) => b.id === blankId);

      if (blank) {
        const isCorrect = result?.blankResults?.[blankId];

        elements.push(
          <span key={`blank-${blankId}`} className="inline-block mx-1">
            {result ? (
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded border-2 ${
                  isCorrect
                    ? 'border-success bg-success/10'
                    : 'border-error bg-error/10'
                }`}
              >
                <span className="font-medium">{answers[blankId] || '___'}</span>
                {isCorrect ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-error" />
                    <span className="text-sm text-success ml-1">
                      ({blank.correctAnswer})
                    </span>
                  </>
                )}
              </span>
            ) : (
              <Input
                type="text"
                value={answers[blankId] || ''}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [blankId]: e.target.value,
                  }))
                }
                placeholder="..."
                disabled={disabled}
                className="w-32 inline-block"
              />
            )}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-end`}>{text.substring(lastIndex)}</span>
      );
    }

    return elements;
  };

  // Check if all blanks are filled
  const allFilled = interaction.blanks.every(
    (blank) => answers[blank.id]?.trim()
  );

  return (
    <Card variant="bordered" className="p-6">
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <Edit3 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
          <h4 className="font-semibold text-foreground">Fill in the Blanks</h4>
        </div>
        <p className="text-sm text-muted ml-7 mb-4">
          Complete the sentence by filling in the blanks.
        </p>
      </div>

      <div className="text-foreground text-lg leading-relaxed mb-6 p-4 bg-surface-secondary rounded-lg">
        {renderTextWithBlanks()}
      </div>

      {/* Hints */}
      {!result && (
        <div className="mb-4 space-y-2">
          {interaction.blanks.map(
            (blank) =>
              blank.hint && (
                <div key={`hint-${blank.id}`} className="text-sm">
                  <button
                    className="text-primary hover:underline"
                    onClick={() => toggleHint(blank.id)}
                  >
                    {showHints[blank.id] ? 'Hide hint' : `Show hint for blank`}
                  </button>
                  {showHints[blank.id] && (
                    <p className="text-muted mt-1 ml-4 italic">
                      Hint: {blank.hint}
                    </p>
                  )}
                </div>
              )
          )}
        </div>
      )}

      {result && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            result.isCorrect ? 'bg-success/10' : 'bg-warning/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-warning" />
            )}
            <span
              className={`font-semibold ${
                result.isCorrect ? 'text-success' : 'text-warning'
              }`}
            >
              {result.isCorrect ? 'All Correct!' : 'Partially Correct'}
            </span>
          </div>
          <p className="text-foreground text-sm">{result.feedback}</p>
        </div>
      )}

      {!result && (
        <Button
          onClick={handleSubmit}
          disabled={!allFilled || isSubmitting || disabled}
          className="w-full"
        >
          {isSubmitting ? 'Checking...' : 'Check Answers'}
        </Button>
      )}

      <div className="mt-3 text-sm text-muted text-center">
        {interaction.points} points
      </div>
    </Card>
  );
}
