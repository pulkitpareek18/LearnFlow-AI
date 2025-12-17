'use client';

import { useState } from 'react';
import {
  Zap,
  BookOpen,
  Eye,
  MessageSquare,
  Target,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import { LearningPreferences } from '@/types';

interface LearningPreferencesOnboardingProps {
  onComplete: (preferences: LearningPreferences) => void;
  onSkip?: () => void;
  initialPreferences?: Partial<LearningPreferences>;
}

const STEPS = [
  { id: 'pace', title: 'Learning Pace', icon: Zap },
  { id: 'style', title: 'Learning Style', icon: Eye },
  { id: 'content', title: 'Content Preferences', icon: BookOpen },
  { id: 'interaction', title: 'Interaction Style', icon: MessageSquare },
  { id: 'challenge', title: 'Challenge Level', icon: Target },
];

export default function LearningPreferencesOnboarding({
  onComplete,
  onSkip,
  initialPreferences,
}: LearningPreferencesOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState<LearningPreferences>({
    preferredPace: initialPreferences?.preferredPace || 'medium',
    learningStyle: initialPreferences?.learningStyle || 'reading',
    contentDepth: initialPreferences?.contentDepth || 'detailed',
    preferExamples: initialPreferences?.preferExamples || 'moderate',
    preferAnalogies: initialPreferences?.preferAnalogies ?? true,
    preferVisualAids: initialPreferences?.preferVisualAids ?? true,
    preferSummaries: initialPreferences?.preferSummaries ?? true,
    interactionFrequency: initialPreferences?.interactionFrequency || 'medium',
    feedbackStyle: initialPreferences?.feedbackStyle || 'encouraging',
    showHintsFirst: initialPreferences?.showHintsFirst ?? false,
    challengeLevel: initialPreferences?.challengeLevel || 'moderate',
    skipMasteredContent: initialPreferences?.skipMasteredContent ?? false,
  });

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(preferences);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'pace':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground text-center mb-6">
              How fast do you like to learn new concepts?
            </h3>
            <div className="grid gap-3">
              {[
                {
                  value: 'slow',
                  label: 'Take it slow',
                  description: 'I prefer thorough explanations and plenty of time to understand',
                },
                {
                  value: 'medium',
                  label: 'Balanced pace',
                  description: 'A good mix of depth and efficiency works best for me',
                },
                {
                  value: 'fast',
                  label: 'Quick learner',
                  description: 'I can pick up concepts quickly and prefer to move fast',
                },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setPreferences({ ...preferences, preferredPace: option.value as 'slow' | 'medium' | 'fast' })
                  }
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    preferences.preferredPace === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground text-center mb-6">
              How do you prefer to learn?
            </h3>
            <div className="grid gap-3">
              {[
                {
                  value: 'visual',
                  label: 'Visual learner',
                  description: 'I learn best with diagrams, charts, and visual representations',
                  icon: Eye,
                },
                {
                  value: 'reading',
                  label: 'Reading/Writing',
                  description: 'I prefer detailed text explanations and taking notes',
                  icon: BookOpen,
                },
                {
                  value: 'interactive',
                  label: 'Interactive/Hands-on',
                  description: 'I learn best by doing - quizzes, exercises, and practice',
                  icon: Zap,
                },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        learningStyle: option.value as 'visual' | 'reading' | 'interactive',
                      })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all flex items-start gap-4 ${
                      preferences.learningStyle === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted mt-1">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground text-center mb-4">
              How do you like your content?
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Content depth</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'concise', label: 'Concise' },
                    { value: 'detailed', label: 'Detailed' },
                    { value: 'comprehensive', label: 'Comprehensive' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          contentDepth: option.value as 'concise' | 'detailed' | 'comprehensive',
                        })
                      }
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        preferences.contentDepth === option.value
                          ? 'bg-primary text-white'
                          : 'bg-border text-foreground hover:bg-border/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Examples preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'extensive', label: 'Lots' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          preferExamples: option.value as 'minimal' | 'moderate' | 'extensive',
                        })
                      }
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        preferences.preferExamples === option.value
                          ? 'bg-primary text-white'
                          : 'bg-border text-foreground hover:bg-border/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'preferAnalogies', label: 'Include real-world analogies' },
                  { key: 'preferVisualAids', label: 'Include visual aids when possible' },
                  { key: 'preferSummaries', label: 'Include section summaries' },
                ].map((option) => (
                  <label key={option.key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          [option.key]: !preferences[option.key as keyof LearningPreferences],
                        })
                      }
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                        preferences[option.key as keyof LearningPreferences]
                          ? 'bg-primary'
                          : 'border-2 border-border'
                      }`}
                    >
                      {preferences[option.key as keyof LearningPreferences] && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'interaction':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground text-center mb-4">
              How do you want to interact with content?
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Knowledge check frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'low', label: 'Less often' },
                    { value: 'medium', label: 'Regular' },
                    { value: 'high', label: 'Frequent' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          interactionFrequency: option.value as 'low' | 'medium' | 'high',
                        })
                      }
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        preferences.interactionFrequency === option.value
                          ? 'bg-primary text-white'
                          : 'bg-border text-foreground hover:bg-border/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Feedback style</label>
                <div className="grid gap-2">
                  {[
                    { value: 'encouraging', label: 'Encouraging', desc: 'Positive, supportive feedback' },
                    { value: 'direct', label: 'Direct', desc: 'Straightforward, to the point' },
                    { value: 'detailed', label: 'Detailed', desc: 'Thorough explanations of right/wrong' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          feedbackStyle: option.value as 'encouraging' | 'direct' | 'detailed',
                        })
                      }
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        preferences.feedbackStyle === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() =>
                    setPreferences({ ...preferences, showHintsFirst: !preferences.showHintsFirst })
                  }
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    preferences.showHintsFirst ? 'bg-primary' : 'border-2 border-border'
                  }`}
                >
                  {preferences.showHintsFirst && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-foreground">Show hints before I try answering</span>
              </label>
            </div>
          </div>
        );

      case 'challenge':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-foreground text-center mb-4">
              How challenged do you want to be?
            </h3>

            <div className="space-y-4">
              <div className="grid gap-3">
                {[
                  {
                    value: 'comfortable',
                    label: 'Stay comfortable',
                    description: 'Focus on building confidence with easier content',
                  },
                  {
                    value: 'moderate',
                    label: 'Balanced challenge',
                    description: 'Mix of comfortable and challenging content',
                  },
                  {
                    value: 'challenging',
                    label: 'Push my limits',
                    description: 'Challenge me with harder questions and less hints',
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        challengeLevel: option.value as 'comfortable' | 'moderate' | 'challenging',
                      })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      preferences.challengeLevel === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted mt-1">{option.description}</p>
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-border">
                <div
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      skipMasteredContent: !preferences.skipMasteredContent,
                    })
                  }
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    preferences.skipMasteredContent ? 'bg-primary' : 'border-2 border-border'
                  }`}
                >
                  {preferences.skipMasteredContent && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="text-foreground font-medium">Skip content I&apos;ve mastered</p>
                  <p className="text-sm text-muted">
                    Automatically skip or simplify content when I demonstrate mastery
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Personalize Your Learning</h2>
            <p className="text-muted mt-2">
              Help us understand how you learn best so we can customize your experience
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      index <= currentStep
                        ? 'bg-primary text-white'
                        : 'bg-border text-muted'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 transition-all ${
                        index < currentStep ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {currentStep > 0 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : onSkip ? (
                <Button variant="ghost" onClick={onSkip}>
                  Skip for now
                </Button>
              ) : null}
            </div>
            <div>
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Start Learning
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
