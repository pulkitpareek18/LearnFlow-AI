'use client';

import { useState } from 'react';
import { ArrowRight, Circle, Square, Diamond, Info } from 'lucide-react';
import Card from '@/components/ui/Card';

interface FlowchartRendererProps {
  visual: {
    type: 'diagram' | 'flowchart' | 'mindmap' | 'infographic';
    description: string;
    svgContent?: string;
  };
}

export default function FlowchartRenderer({ visual }: FlowchartRendererProps) {
  const [showDescription, setShowDescription] = useState(true);

  // Parse description to extract flowchart steps if formatted correctly
  const parseFlowchartSteps = (description: string): string[] => {
    // Look for numbered steps or arrow-separated steps
    const steps = description
      .split(/\n|\d+\.\s|→|->|=>/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return steps.length > 1 ? steps : [description];
  };

  const steps = parseFlowchartSteps(visual.description);

  return (
    <div className="space-y-4">
      {/* Flowchart Visualization */}
      {visual.svgContent ? (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20 p-8">
          <div
            className="w-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: visual.svgContent }}
          />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20 p-6">
          {/* Simple Flowchart Representation */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                {/* Step Indicator */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-primary rotate-90" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-2">
                  <Card variant="bordered" className="bg-background">
                    <div className="p-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        {step}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Description Button */}
      <div className="text-center">
        <button
          onClick={() => setShowDescription(!showDescription)}
          className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          {showDescription ? 'Hide' : 'Show'} Detailed Description
        </button>
      </div>

      {/* Full Description */}
      {showDescription && (
        <Card variant="bordered" className="bg-background">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Flowchart Description
            </h4>
            <div className="text-sm text-foreground leading-relaxed space-y-2">
              {visual.description.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Square className="w-4 h-4" />
          <span>Process</span>
        </div>
        <div className="flex items-center gap-2">
          <Diamond className="w-4 h-4" />
          <span>Decision</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4" />
          <span>Start/End</span>
        </div>
      </div>
    </div>
  );
}
