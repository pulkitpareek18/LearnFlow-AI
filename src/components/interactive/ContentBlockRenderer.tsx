'use client';

import { ContentBlock, InteractionResponse } from '@/types';
import MCQInteraction from './interactions/MCQInteraction';
import FillBlankInteraction from './interactions/FillBlankInteraction';
import ReflectionInteraction from './interactions/ReflectionInteraction';
import RevealInteraction from './interactions/RevealInteraction';
import ConfirmInteraction from './interactions/ConfirmInteraction';
import CodeInteraction from './interactions/CodeInteraction';

interface ContentBlockRendererProps {
  block: ContentBlock;
  courseId: string;
  moduleId: string;
  onInteractionSubmit: (
    blockId: string,
    interactionType: string,
    response: any,
    timeSpent: number
  ) => Promise<any>;
  previousResponse?: InteractionResponse;
  disabled?: boolean;
}

export default function ContentBlockRenderer({
  block,
  courseId,
  moduleId,
  onInteractionSubmit,
  previousResponse,
  disabled = false,
}: ContentBlockRendererProps) {
  // Track time spent on this block
  const startTime = Date.now();

  const handleSubmit = async (response: any) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    return onInteractionSubmit(
      block.id,
      block.interaction?.type || '',
      response,
      timeSpent
    );
  };

  // Render text block
  if (block.type === 'text') {
    return (
      <div className="prose prose-lg max-w-none text-foreground mb-8">
        {block.content?.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed">
            {paragraph.split('\n').map((line, lineIndex) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < paragraph.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
    );
  }

  // Render interaction block
  if (block.type === 'interaction' && block.interaction) {
    const interaction = block.interaction;

    return (
      <div className="mb-8">
        {interaction.type === 'mcq' && (
          <MCQInteraction
            interaction={interaction as any}
            onSubmit={handleSubmit}
            disabled={disabled}
            previousResponse={previousResponse?.response as any}
          />
        )}

        {interaction.type === 'fill_blank' && (
          <FillBlankInteraction
            interaction={interaction as any}
            onSubmit={handleSubmit}
            disabled={disabled}
            previousResponse={previousResponse?.response as any}
          />
        )}

        {interaction.type === 'reflection' && (
          <ReflectionInteraction
            interaction={interaction as any}
            onSubmit={handleSubmit}
            disabled={disabled}
            previousResponse={previousResponse?.response as any}
          />
        )}

        {interaction.type === 'reveal' && (
          <RevealInteraction
            interaction={interaction as any}
            onReveal={() =>
              handleSubmit({ revealed: true })
            }
            disabled={disabled}
          />
        )}

        {interaction.type === 'confirm' && (
          <ConfirmInteraction
            interaction={interaction as any}
            onSubmit={handleSubmit}
            disabled={disabled}
            previousResponse={previousResponse?.response as any}
          />
        )}

        {interaction.type === 'code' && (
          <CodeInteraction
            interaction={interaction as any}
            onSubmit={handleSubmit}
            disabled={disabled}
            previousResponse={previousResponse?.response as any}
          />
        )}
      </div>
    );
  }

  return null;
}
