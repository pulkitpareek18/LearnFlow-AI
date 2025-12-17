'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Card } from '@/components/ui';
import { RevealInteraction as RevealType } from '@/types';

interface RevealInteractionProps {
  interaction: RevealType;
  onReveal?: () => void;
  disabled?: boolean;
}

export default function RevealInteraction({
  interaction,
  onReveal,
  disabled = false,
}: RevealInteractionProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    if (disabled) return;
    setIsRevealed(!isRevealed);
    if (!isRevealed && onReveal) {
      onReveal();
    }
  };

  return (
    <Card variant="bordered" className="p-4">
      <button
        onClick={handleReveal}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
          disabled
            ? 'bg-surface-secondary cursor-not-allowed opacity-60'
            : isRevealed
            ? 'bg-secondary/10 hover:bg-secondary/20'
            : 'bg-secondary/5 hover:bg-secondary/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <Eye
            className={`w-5 h-5 ${
              isRevealed ? 'text-secondary' : 'text-muted'
            }`}
          />
          <span className="font-medium text-foreground">
            {interaction.buttonText}
          </span>
        </div>
        {isRevealed ? (
          <ChevronUp className="w-5 h-5 text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted" />
        )}
      </button>

      {isRevealed && (
        <div className="mt-4 p-4 bg-surface-secondary rounded-lg animate-fadeIn">
          <div className="prose prose-sm max-w-none text-foreground">
            {interaction.revealedContent.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted mt-2 text-center">
        Optional • Click to learn more
      </p>
    </Card>
  );
}
