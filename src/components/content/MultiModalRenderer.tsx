'use client';

import { useState, useEffect } from 'react';
import {
  Eye,
  FileText,
  Volume2,
  MousePointerClick,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MultiModalContent, ContentFormat } from '@/types';
import DiagramRenderer from './DiagramRenderer';
import FlowchartRenderer from './FlowchartRenderer';
import MindmapRenderer from './MindmapRenderer';

interface MultiModalRendererProps {
  content: MultiModalContent;
  defaultFormat?: ContentFormat;
  onFormatChange?: (format: ContentFormat) => void;
  showFormatSwitcher?: boolean;
  className?: string;
}

const formatIcons: Record<ContentFormat, any> = {
  text: FileText,
  visual: Eye,
  audio_description: Volume2,
  interactive: MousePointerClick,
};

const formatLabels: Record<ContentFormat, string> = {
  text: 'Text',
  visual: 'Visual',
  audio_description: 'Audio',
  interactive: 'Interactive',
};

export default function MultiModalRenderer({
  content,
  defaultFormat = 'text',
  onFormatChange,
  showFormatSwitcher = true,
  className = '',
}: MultiModalRendererProps) {
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>(defaultFormat);
  const [isLoading, setIsLoading] = useState(false);

  // Get available formats from content
  // Map property names to ContentFormat values
  const formatMapping: Record<string, ContentFormat> = {
    text: 'text',
    visual: 'visual',
    audioDescription: 'audio_description',
    interactive: 'interactive',
  };

  const availableFormats = Object.keys(content.formats)
    .filter((key) => {
      const value = content.formats[key as keyof typeof content.formats];
      return value !== undefined && value !== null;
    })
    .map((key) => formatMapping[key])
    .filter((format): format is ContentFormat => format !== undefined);

  // Update selected format when default changes or if current format is not available
  useEffect(() => {
    if (!availableFormats.includes(selectedFormat)) {
      const newFormat = availableFormats[0] || 'text';
      setSelectedFormat(newFormat);
      onFormatChange?.(newFormat);
    }
  }, [content, availableFormats]);

  const handleFormatChange = (format: ContentFormat) => {
    if (availableFormats.includes(format)) {
      setIsLoading(true);
      setSelectedFormat(format);
      onFormatChange?.(format);
      // Simulate loading for smooth transition
      setTimeout(() => setIsLoading(false), 150);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      );
    }

    switch (selectedFormat) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            <div className="text-foreground whitespace-pre-wrap leading-relaxed">
              {content.formats.text}
            </div>
          </div>
        );

      case 'visual':
        if (!content.formats.visual) {
          return <FallbackMessage format="visual" />;
        }
        return (
          <div className="space-y-4">
            {content.formats.visual.type === 'diagram' && (
              <DiagramRenderer visual={content.formats.visual} />
            )}
            {content.formats.visual.type === 'flowchart' && (
              <FlowchartRenderer visual={content.formats.visual} />
            )}
            {content.formats.visual.type === 'mindmap' && (
              <MindmapRenderer visual={content.formats.visual} />
            )}
            {content.formats.visual.type === 'infographic' && (
              <DiagramRenderer visual={content.formats.visual} />
            )}
          </div>
        );

      case 'audio_description':
        if (!content.formats.audioDescription) {
          return <FallbackMessage format="audio_description" />;
        }
        return (
          <div className="bg-secondary/5 rounded-lg p-6 border-l-4 border-secondary">
            <div className="flex items-start gap-3 mb-4">
              <Volume2 className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">
                  Audio-Optimized Description
                </h4>
                <p className="text-sm text-muted">
                  Read aloud or use with screen readers
                </p>
              </div>
            </div>
            <div
              className="text-foreground leading-relaxed space-y-3"
              role="article"
              aria-label="Audio description"
            >
              {content.formats.audioDescription.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        );

      case 'interactive':
        if (!content.formats.interactive) {
          return <FallbackMessage format="interactive" />;
        }
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-primary/20">
              <div className="flex items-start gap-3 mb-4">
                <MousePointerClick className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {content.formats.interactive.config.title || 'Interactive Element'}
                  </h4>
                  <p className="text-sm text-muted">
                    {content.formats.interactive.config.description ||
                      'Engage with this interactive content'}
                  </p>
                </div>
              </div>

              {/* Interactive Config Display */}
              <div className="space-y-3">
                {content.formats.interactive.config.steps && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Steps:</p>
                    <ol className="space-y-2">
                      {content.formats.interactive.config.steps.map(
                        (step: string, i: number) => (
                          <li key={i} className="text-sm text-foreground flex gap-2">
                            <span className="font-semibold text-primary">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        )
                      )}
                    </ol>
                  </div>
                )}

                {content.formats.interactive.config.elements && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Elements:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {content.formats.interactive.config.elements.map(
                        (element: any, i: number) => (
                          <div
                            key={i}
                            className="bg-background rounded p-3 border border-border"
                          >
                            {typeof element === 'string' ? (
                              <p className="text-sm text-foreground">{element}</p>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-foreground">
                                  {element.name || element.label}
                                </p>
                                {element.description && (
                                  <p className="text-xs text-muted mt-1">
                                    {element.description}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <FallbackMessage format={selectedFormat} />;
    }
  };

  if (availableFormats.length === 0) {
    return (
      <Card variant="bordered" className={className}>
        <CardContent>
          <div className="text-center py-8 text-muted">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No content formats available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Format Switcher */}
      {showFormatSwitcher && availableFormats.length > 1 && (
        <div className="mb-4">
          {/* Desktop Tabs */}
          <div className="hidden sm:flex gap-2 border-b border-border">
            {availableFormats.map((format) => {
              const Icon = formatIcons[format];
              const isActive = selectedFormat === format;

              return (
                <button
                  key={format}
                  onClick={() => handleFormatChange(format)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all
                    ${
                      isActive
                        ? 'border-primary text-primary font-medium'
                        : 'border-transparent text-muted hover:text-foreground hover:border-border'
                    }
                  `}
                  aria-label={`Switch to ${formatLabels[format]} format`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{formatLabels[format]}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(e.target.value as ContentFormat)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableFormats.map((format) => (
                <option key={format} value={format}>
                  {formatLabels[format]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Display */}
      <Card variant="bordered">
        <CardContent className="p-6">{renderContent()}</CardContent>
      </Card>

      {/* Format Info Footer */}
      {showFormatSwitcher && (
        <div className="mt-3 text-xs text-muted text-center">
          {content.preferredFor.length > 0 && (
            <p>
              Recommended for:{' '}
              {content.preferredFor.map((style) => style).join(', ')} learners
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FallbackMessage({ format }: { format: ContentFormat }) {
  return (
    <div className="text-center py-8 text-muted">
      <p>
        {formatLabels[format]} format is not available for this content.
      </p>
    </div>
  );
}
