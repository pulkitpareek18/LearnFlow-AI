'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { MCQInteraction as MCQInteractionType, MCQOption } from '@/types';

interface MCQInteractionProps {
  interaction: MCQInteractionType;
  onSubmit: (response: { selectedOptionId: string }) => Promise<{
    isCorrect: boolean;
    score: number;
    maxScore: number;
    feedback: string;
    correctAnswer?: string;
  }>;
  disabled?: boolean;
  previousResponse?: { selectedOptionId: string };
}

export default function MCQInteraction({
  interaction,
  onSubmit,
  disabled = false,
  previousResponse,
}: MCQInteractionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    previousResponse?.selectedOptionId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    correctAnswer?: string;
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = async () => {
    if (!selectedOption || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const response = await onSubmit({ selectedOptionId: selectedOption });
      setResult({
        isCorrect: response.isCorrect,
        feedback: response.feedback,
        correctAnswer: response.correctAnswer,
      });
    } catch (error) {
      console.error('Error submitting MCQ:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionStyle = (option: MCQOption) => {
    const baseStyle =
      'w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ';

    if (result) {
      if (option.isCorrect) {
        return baseStyle + 'border-success bg-success/10 cursor-default';
      }
      if (option.id === selectedOption && !option.isCorrect) {
        return baseStyle + 'border-error bg-error/10 cursor-default';
      }
      return baseStyle + 'border-border bg-surface cursor-default opacity-60';
    }

    if (selectedOption === option.id) {
      return baseStyle + 'border-primary bg-primary/10 cursor-pointer';
    }

    return (
      baseStyle +
      'border-border bg-surface hover:border-primary/50 cursor-pointer'
    );
  };

  return (
    <Card variant="bordered" className="p-6">
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <h4 className="font-semibold text-foreground">Multiple Choice</h4>
        </div>
        <p className="text-foreground ml-7">{interaction.question}</p>
      </div>

      <div className="space-y-3 mb-4">
        {interaction.options.map((option) => (
          <button
            key={option.id}
            className={getOptionStyle(option)}
            onClick={() => !result && !disabled && setSelectedOption(option.id)}
            disabled={!!result || disabled}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  result
                    ? option.isCorrect
                      ? 'border-success bg-success text-white'
                      : option.id === selectedOption
                      ? 'border-error bg-error text-white'
                      : 'border-border'
                    : selectedOption === option.id
                    ? 'border-primary bg-primary'
                    : 'border-border'
                }`}
              >
                {result && option.isCorrect && (
                  <CheckCircle className="w-4 h-4" />
                )}
                {result && option.id === selectedOption && !option.isCorrect && (
                  <XCircle className="w-4 h-4" />
                )}
              </div>
              <span className="text-foreground">{option.text}</span>
            </div>
            {result && option.id === selectedOption && option.feedback && (
              <p className="text-sm text-muted mt-2 ml-9">{option.feedback}</p>
            )}
          </button>
        ))}
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            result.isCorrect ? 'bg-success/10' : 'bg-error/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.isCorrect ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-error" />
            )}
            <span
              className={`font-semibold ${
                result.isCorrect ? 'text-success' : 'text-error'
              }`}
            >
              {result.isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          <p className="text-foreground text-sm">{result.feedback}</p>
        </div>
      )}

      {interaction.explanation && result && (
        <div className="mb-4">
          <button
            className="text-primary text-sm hover:underline"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? 'Hide explanation' : 'Show explanation'}
          </button>
          {showExplanation && (
            <p className="text-sm text-muted mt-2 p-3 bg-surface-secondary rounded-lg">
              {interaction.explanation}
            </p>
          )}
        </div>
      )}

      {!result && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting || disabled}
          className="w-full"
        >
          {isSubmitting ? 'Checking...' : 'Submit Answer'}
        </Button>
      )}

      <div className="mt-3 text-sm text-muted text-center">
        {interaction.points} points
      </div>
    </Card>
  );
}
