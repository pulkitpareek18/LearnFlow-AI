'use client';

import { CheckCircle, Circle, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { ContentBlock, InteractionResponse } from '@/types';

interface InteractionProgressProps {
  contentBlocks: ContentBlock[];
  responses: InteractionResponse[];
  currentBlockIndex?: number;
}

export default function InteractionProgress({
  contentBlocks,
  responses,
  currentBlockIndex,
}: InteractionProgressProps) {
  // Get only interaction blocks with points (graded interactions)
  const interactionBlocks = contentBlocks.filter(
    (block) => block.type === 'interaction' && (block.interaction as any)?.points
  );

  // Calculate progress
  const completedCount = interactionBlocks.filter((block) =>
    responses.some((r) => r.blockId === block.id)
  ).length;

  const totalPoints = interactionBlocks.reduce(
    (sum, block) => sum + ((block.interaction as any)?.points || 0),
    0
  );

  const earnedPoints = responses
    .filter((r) => interactionBlocks.some((b) => b.id === r.blockId))
    .reduce((sum, r) => sum + (r.score || 0), 0);

  const progressPercent =
    interactionBlocks.length > 0
      ? Math.round((completedCount / interactionBlocks.length) * 100)
      : 0;

  if (interactionBlocks.length === 0) {
    return null;
  }

  return (
    <Card variant="bordered" className="lg:sticky lg:top-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">Module Progress</h4>
          <span className="text-xs sm:text-sm text-muted whitespace-nowrap">
            {completedCount}/{interactionBlocks.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-border rounded-full overflow-hidden mb-4">
          <div
            className={`h-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Points display */}
        <div className="flex items-center justify-between mb-4 p-2 sm:p-3 bg-surface-secondary rounded-lg gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0" />
            <span className="text-xs sm:text-sm text-muted truncate">Points</span>
          </div>
          <span className="font-bold text-foreground text-sm sm:text-base whitespace-nowrap">
            {earnedPoints}/{totalPoints}
          </span>
        </div>

        {/* Interaction checklist */}
        <div className="space-y-1 sm:space-y-2">
          {interactionBlocks.map((block, index) => {
            const isCompleted = responses.some((r) => r.blockId === block.id);
            const isCurrent =
              currentBlockIndex !== undefined &&
              contentBlocks[currentBlockIndex]?.id === block.id;
            const response = responses.find((r) => r.blockId === block.id);
            const isCorrect = response?.isCorrect;

            return (
              <div
                key={block.id}
                className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-primary/10'
                    : isCompleted
                    ? 'bg-surface-secondary'
                    : ''
                }`}
              >
                {isCompleted ? (
                  <CheckCircle
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                      isCorrect === true
                        ? 'text-success'
                        : isCorrect === false
                        ? 'text-error'
                        : 'text-muted'
                    }`}
                  />
                ) : (
                  <Circle
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                      isCurrent ? 'text-primary' : 'text-muted'
                    }`}
                  />
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <span
                    className={`text-xs sm:text-sm truncate block ${
                      isCompleted ? 'text-muted' : 'text-foreground'
                    }`}
                  >
                    {getInteractionLabel(block.interaction?.type)}
                  </span>
                </div>
                <span className="text-xs text-muted flex-shrink-0 whitespace-nowrap">
                  {response?.score !== undefined
                    ? `${response.score}/${(block.interaction as any)?.points}`
                    : `${(block.interaction as any)?.points}pt`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Completion message */}
        {progressPercent === 100 && (
          <div className="mt-4 p-3 bg-success/10 rounded-lg text-center">
            <Trophy className="w-6 h-6 text-success mx-auto mb-1" />
            <p className="text-sm font-medium text-success">
              All interactions complete!
            </p>
            <p className="text-xs text-muted mt-1">
              Score: {Math.round((earnedPoints / totalPoints) * 100)}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getInteractionLabel(type?: string): string {
  switch (type) {
    case 'mcq':
      return 'Multiple Choice';
    case 'fill_blank':
      return 'Fill in the Blanks';
    case 'reflection':
      return 'Reflection';
    case 'reveal':
      return 'Learn More';
    case 'confirm':
      return 'Self-Check';
    default:
      return 'Activity';
  }
}
