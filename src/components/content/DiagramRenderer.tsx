'use client';

import { useState } from 'react';
import { Maximize2, Minimize2, Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface DiagramRendererProps {
  visual: {
    type: 'diagram' | 'infographic' | 'flowchart' | 'mindmap';
    description: string;
    svgContent?: string;
  };
}

export default function DiagramRenderer({ visual }: DiagramRendererProps) {
  const [showDescription, setShowDescription] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Visual Container */}
      <div
        className={`relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20 overflow-hidden transition-all ${
          isExpanded ? 'fixed inset-4 z-50' : ''
        }`}
      >
        {/* Expand/Collapse Button */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDescription(!showDescription)}
            className="bg-background/80 backdrop-blur"
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-background/80 backdrop-blur"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* SVG Content or Placeholder */}
        <div
          className={`flex items-center justify-center ${
            isExpanded ? 'h-full' : 'min-h-[300px] p-8'
          }`}
        >
          {visual.svgContent ? (
            <div
              className="w-full h-full flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: visual.svgContent }}
            />
          ) : (
            <div className="text-center space-y-4 max-w-2xl p-6">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {visual.type === 'diagram'
                    ? 'Diagram'
                    : visual.type === 'infographic'
                    ? 'Infographic'
                    : 'Visual Representation'}
                </h4>
                <p className="text-sm text-muted">
                  Visualize the concept using the description below
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {showDescription && (
        <Card variant="bordered" className="bg-background">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Visual Description
            </h4>
            <div className="text-sm text-foreground leading-relaxed space-y-2">
              {visual.description.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Accessibility Note */}
      <div className="text-xs text-muted italic text-center">
        Visual learners: Study the diagram or mental image carefully. Reading
        learners: Focus on the description above.
      </div>
    </div>
  );
}
