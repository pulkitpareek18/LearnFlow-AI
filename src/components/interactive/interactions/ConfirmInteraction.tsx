'use client';

import { useState } from 'react';
import { CheckSquare, ThumbsUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui';
import { ConfirmInteraction as ConfirmType } from '@/types';

interface ConfirmInteractionProps {
  interaction: ConfirmType;
  onSubmit?: (response: {
    understandingLevel: 'fully' | 'partially' | 'not_yet';
  }) => void;
  disabled?: boolean;
  previousResponse?: { understandingLevel: 'fully' | 'partially' | 'not_yet' };
}

export default function ConfirmInteraction({
  interaction,
  onSubmit,
  disabled = false,
  previousResponse,
}: ConfirmInteractionProps) {
  const [selected, setSelected] = useState<
    'fully' | 'partially' | 'not_yet' | null
  >(previousResponse?.understandingLevel || null);
  const [submitted, setSubmitted] = useState(!!previousResponse);

  // Use options from interaction, or fall back to default options
  const options = interaction.options || [
    { text: 'Yes, I understand completely', value: 'fully' as const },
    { text: 'I understand most of it', value: 'partially' as const },
    { text: 'I need to review this again', value: 'not_yet' as const },
  ];

  const handleSelect = (value: 'fully' | 'partially' | 'not_yet') => {
    if (disabled || submitted) return;
    setSelected(value);
    setSubmitted(true);
    if (onSubmit) {
      onSubmit({ understandingLevel: value });
    }
  };

  const getOptionIcon = (value: string) => {
    switch (value) {
      case 'fully':
        return <ThumbsUp className="w-5 h-5 text-success" />;
      case 'partially':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'not_yet':
        return <RefreshCw className="w-5 h-5 text-secondary" />;
      default:
        return null;
    }
  };

  const getOptionStyle = (value: string) => {
    const baseStyle =
      'w-full p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-3 ';

    if (submitted) {
      if (selected === value) {
        switch (value) {
          case 'fully':
            return baseStyle + 'border-success bg-success/10';
          case 'partially':
            return baseStyle + 'border-warning bg-warning/10';
          case 'not_yet':
            return baseStyle + 'border-secondary bg-secondary/10';
        }
      }
      return baseStyle + 'border-border bg-surface opacity-50 cursor-default';
    }

    return (
      baseStyle +
      'border-border bg-surface hover:border-primary/50 cursor-pointer'
    );
  };

  const getFeedback = () => {
    switch (selected) {
      case 'fully':
        return {
          message: "Great! You're confident in your understanding. Keep up the excellent work!",
          color: 'text-success',
          bgColor: 'bg-success/10',
        };
      case 'partially':
        return {
          message:
            "That's okay! Consider reviewing the key concepts before moving on. You can always come back.",
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        };
      case 'not_yet':
        return {
          message:
            "No worries! Learning takes time. Take a moment to re-read this section, or try the AI tutor for help.",
          color: 'text-secondary',
          bgColor: 'bg-secondary/10',
        };
      default:
        return null;
    }
  };

  const feedback = getFeedback();

  return (
    <Card variant="bordered" className="p-6">
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <CheckSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <h4 className="font-semibold text-foreground">Self-Assessment</h4>
        </div>
        <p className="text-foreground ml-7">{interaction.statement}</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.value}
            className={getOptionStyle(option.value)}
            onClick={() =>
              handleSelect(option.value as 'fully' | 'partially' | 'not_yet')
            }
            disabled={disabled || submitted}
          >
            {getOptionIcon(option.value)}
            <span className="text-foreground">{option.text}</span>
          </button>
        ))}
      </div>

      {submitted && feedback && (
        <div className={`mt-4 p-4 rounded-lg ${feedback.bgColor}`}>
          <p className={`${feedback.color} font-medium`}>{feedback.message}</p>
        </div>
      )}

      <p className="text-xs text-muted mt-4 text-center">
        Self-assessment checkpoint • No points
      </p>
    </Card>
  );
}
