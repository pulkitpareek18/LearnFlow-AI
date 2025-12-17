'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  MessageSquare,
  X,
  Send,
  Lightbulb,
  Trophy,
  TrendingUp,
  Sparkles,
  Settings2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Spinner,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import {
  ContentBlockRenderer,
  InteractionProgress,
  AdaptiveRecommendations,
} from '@/components/interactive';
import LearningPreferencesOnboarding from '@/components/student/LearningPreferencesOnboarding';
import { ContentBlock, InteractionResponse, LearningPreferences } from '@/types';

interface Module {
  _id: string;
  title: string;
  content: string;
  contentBlocks?: ContentBlock[];
  isInteractive?: boolean;
  aiGeneratedContent?: {
    summary: string;
    keyPoints: string[];
    examples: string[];
  };
  estimatedTime: number;
  order: number;
  difficultyLevel?: number;
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  modules: Module[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  teacherId: {
    name: string;
  };
  chapters: Chapter[];
  interactiveSettings?: {
    adaptiveLearningEnabled: boolean;
    gradingWeight: {
      interactions: number;
      assessments: number;
    };
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ModuleInteractionData {
  moduleId: string;
  responses: InteractionResponse[];
  totalScore: number;
  maxPossibleScore: number;
}

interface PersonalizationState {
  isPersonalized: boolean;
  isLoading: boolean;
  adaptations?: {
    contentDepthAdjusted: boolean;
    examplesAdded: boolean;
    analogiesIncluded: boolean;
    difficultyAdjusted: number;
    interactionFrequencyAdjusted: boolean;
  };
  encouragementMessage?: string;
  personalizedSummary?: string;
}

export default function LearnCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { addToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  // Interactive learning state
  const [moduleInteractions, setModuleInteractions] = useState<Map<string, ModuleInteractionData>>(
    new Map()
  );
  const [currentResponses, setCurrentResponses] = useState<InteractionResponse[]>([]);

  // Personalization state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [personalization, setPersonalization] = useState<PersonalizationState>({
    isPersonalized: false,
    isLoading: false,
  });
  const [personalizedModule, setPersonalizedModule] = useState<Module | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchProgress();
    checkOnboarding();
  }, [courseId]);

  // Fetch personalized content when module changes
  useEffect(() => {
    if (currentModule && course?.interactiveSettings?.adaptiveLearningEnabled && onboardingChecked) {
      fetchPersonalizedContent(currentModule);
    } else {
      setPersonalizedModule(null);
      setPersonalization({ isPersonalized: false, isLoading: false });
    }
  }, [currentModule?._id, onboardingChecked]);

  // Load responses when module changes
  useEffect(() => {
    if (currentModule && moduleInteractions.has(currentModule._id)) {
      setCurrentResponses(moduleInteractions.get(currentModule._id)?.responses || []);
    } else {
      setCurrentResponses([]);
    }
  }, [currentModule, moduleInteractions]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (result.success) {
        setCourse(result.data);
        // Expand first chapter and select first module
        if (result.data.chapters?.length > 0) {
          const firstChapter = result.data.chapters[0];
          setExpandedChapters(new Set([firstChapter._id]));
          if (firstChapter.modules?.length > 0) {
            setCurrentModule(firstChapter.modules[0]);
          }
        }
      } else {
        addToast('error', 'Failed to load course');
        router.push('/student/courses');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      addToast('error', 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?courseId=${courseId}`);
      const result = await response.json();
      if (result.success && result.data) {
        if (result.data.completedModules) {
          setCompletedModules(new Set(result.data.completedModules));
        }
        // Load module interactions
        if (result.data.moduleInteractions) {
          const interactionsMap = new Map<string, ModuleInteractionData>();
          result.data.moduleInteractions.forEach((mi: any) => {
            interactionsMap.set(mi.moduleId, mi);
          });
          setModuleInteractions(interactionsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const checkOnboarding = async () => {
    try {
      const response = await fetch('/api/student/preferences');
      const result = await response.json();
      if (result.success) {
        const onboardingComplete = result.data?.onboardingCompleted;
        setShowOnboarding(!onboardingComplete);
        setOnboardingChecked(true);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
      setOnboardingChecked(true);
    }
  };

  const fetchPersonalizedContent = async (module: Module) => {
    // Only personalize interactive modules
    if (!module.isInteractive || !module.contentBlocks?.length) {
      setPersonalizedModule(null);
      setPersonalization({ isPersonalized: false, isLoading: false });
      return;
    }

    setPersonalization((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/adaptive/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module._id,
          courseId,
        }),
      });

      const result = await response.json();

      if (result.success && result.data.personalized) {
        setPersonalizedModule(result.data.module);
        setPersonalization({
          isPersonalized: true,
          isLoading: false,
          adaptations: result.data.adaptations,
          encouragementMessage: result.data.encouragementMessage,
          personalizedSummary: result.data.personalizedSummary,
        });
      } else {
        setPersonalizedModule(null);
        setPersonalization({
          isPersonalized: false,
          isLoading: false,
        });
        // Check if we need to show onboarding
        if (result.data?.showOnboarding) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error fetching personalized content:', error);
      setPersonalizedModule(null);
      setPersonalization({ isPersonalized: false, isLoading: false });
    }
  };

  const handleOnboardingComplete = async (preferences: LearningPreferences) => {
    try {
      const response = await fetch('/api/student/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          completeOnboarding: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowOnboarding(false);
        addToast('success', 'Preferences saved! Your learning experience is now personalized.');
        // Refetch personalized content for current module
        if (currentModule) {
          fetchPersonalizedContent(currentModule);
        }
      } else {
        addToast('error', 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      addToast('error', 'Failed to save preferences');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleInteractionSubmit = useCallback(
    async (blockId: string, interactionType: string, response: any, timeSpent: number) => {
      if (!currentModule) return null;

      try {
        const apiResponse = await fetch('/api/interactions/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: currentModule._id,
            courseId,
            blockId,
            interactionType,
            response,
            timeSpent,
            attempt: 1,
          }),
        });

        const result = await apiResponse.json();

        if (result.success) {
          // Update local responses
          const newResponse: InteractionResponse = {
            blockId,
            interactionType: interactionType as any,
            response,
            isCorrect: result.data.isCorrect,
            score: result.data.score,
            maxScore: result.data.maxScore,
            timeSpent,
            attempts: 1,
            aiFeedback: result.data.aiFeedback,
            submittedAt: new Date(),
          };

          setCurrentResponses((prev) => {
            const filtered = prev.filter((r) => r.blockId !== blockId);
            return [...filtered, newResponse];
          });

          // Update module interactions map
          setModuleInteractions((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(currentModule._id) || {
              moduleId: currentModule._id,
              responses: [],
              totalScore: 0,
              maxPossibleScore: 0,
            };
            existing.responses = existing.responses.filter((r) => r.blockId !== blockId);
            existing.responses.push(newResponse);
            existing.totalScore = result.data.moduleProgress.totalScore;
            existing.maxPossibleScore = result.data.moduleProgress.maxPossibleScore;
            newMap.set(currentModule._id, existing);
            return newMap;
          });

          return result.data;
        } else {
          addToast('error', 'Failed to submit response');
          return null;
        }
      } catch (error) {
        console.error('Error submitting interaction:', error);
        addToast('error', 'Failed to submit response');
        return null;
      }
    },
    [currentModule, courseId, addToast]
  );

  const handleModuleComplete = async () => {
    if (!currentModule || !course) return;

    // Check if all required interactions are completed (for interactive modules)
    if (currentModule.isInteractive && currentModule.contentBlocks) {
      const requiredBlocks = currentModule.contentBlocks.filter(
        (b) => b.isRequired && b.type === 'interaction'
      );
      const completedRequired = requiredBlocks.filter((b) =>
        currentResponses.some((r) => r.blockId === b.id)
      );

      if (completedRequired.length < requiredBlocks.length) {
        addToast('warning', 'Please complete all required interactions first');
        return;
      }
    }

    // Find which chapter this module belongs to
    const chapter = course.chapters.find((c) =>
      c.modules.some((m) => m._id === currentModule._id)
    );

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId: currentModule._id,
          chapterId: chapter?._id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCompletedModules((prev) => new Set([...prev, currentModule._id]));
        addToast('success', 'Module completed!');

        // Auto-navigate to next module
        const allModules = course.chapters.flatMap((c) => c.modules) || [];
        const currentIndex = allModules.findIndex((m) => m._id === currentModule._id);
        if (currentIndex < allModules.length - 1) {
          setCurrentModule(allModules[currentIndex + 1]);
        }
      } else {
        addToast('error', 'Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      addToast('error', 'Failed to save progress');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentModule) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: currentModule._id,
          message: userMessage,
          history: chatMessages,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: result.data.response },
        ]);
      } else {
        addToast('error', 'Failed to get response');
      }
    } catch {
      addToast('error', 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Calculate overall module score
  const getModuleScore = () => {
    if (!currentModule?._id) return null;
    const data = moduleInteractions.get(currentModule._id);
    if (!data || data.maxPossibleScore === 0) return null;
    return Math.round((data.totalScore / data.maxPossibleScore) * 100);
  };

  const moduleScore = getModuleScore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Course not found</h2>
        <Link href="/student/courses">
          <Button>Back to Courses</Button>
        </Link>
      </div>
    );
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <LearningPreferencesOnboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    );
  }

  // Get the module to display (personalized or original)
  const displayModule = personalizedModule || currentModule;

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100vh-8rem)]">
      {/* Sidebar - Chapter Navigation */}
      <div className="w-full xl:w-72 2xl:w-80 border-b xl:border-b-0 xl:border-r border-border bg-card overflow-y-auto flex-shrink-0 xl:h-[calc(100vh-8rem)] xl:sticky xl:top-0">
        <div className="p-3 sm:p-4 border-b border-border">
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          <h2 className="font-semibold text-foreground line-clamp-2">{course.title}</h2>
          <p className="text-sm text-muted mt-1">By {course.teacherId?.name}</p>
        </div>

        {/* Adaptive Recommendations (compact) */}
        {course.interactiveSettings?.adaptiveLearningEnabled && (
          <div className="p-2 border-b border-border">
            <AdaptiveRecommendations
              courseId={courseId}
              moduleId={currentModule?._id}
              compact
            />
          </div>
        )}

        <nav className="p-2">
          {course.chapters.map((chapter, chapterIndex) => (
            <div key={chapter._id} className="mb-2">
              <button
                onClick={() => toggleChapter(chapter._id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-border transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted">
                    {chapterIndex + 1}.
                  </span>
                  <span className="text-sm font-medium text-foreground text-left">
                    {chapter.title}
                  </span>
                </div>
                {expandedChapters.has(chapter._id) ? (
                  <ChevronDown className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted" />
                )}
              </button>

              {expandedChapters.has(chapter._id) && (
                <div className="ml-4 mt-1 space-y-1">
                  {chapter.modules.map((module, moduleIndex) => {
                    const isActive = currentModule?._id === module._id;
                    const isCompleted = completedModules.has(module._id);
                    const interactionData = moduleInteractions.get(module._id);
                    const hasInteractions = interactionData && interactionData.maxPossibleScore > 0;
                    const score = hasInteractions
                      ? Math.round((interactionData.totalScore / interactionData.maxPossibleScore) * 100)
                      : null;

                    return (
                      <button
                        key={module._id}
                        onClick={() => setCurrentModule(module)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-border text-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted flex-shrink-0" />
                        )}
                        <span className="text-sm line-clamp-1 flex-1">
                          {chapterIndex + 1}.{moduleIndex + 1} {module.title}
                        </span>
                        {score !== null && (
                          <span className={`text-xs ${score >= 70 ? 'text-success' : 'text-warning'}`}>
                            {score}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {currentModule ? (
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Personalization Loading */}
            {personalization.isLoading && (
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
                <Spinner size="sm" />
                <span className="text-sm text-primary">Personalizing content for you...</span>
              </div>
            )}

            {/* Personalization Status & Encouragement */}
            {personalization.isPersonalized && personalization.encouragementMessage && (
              <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-primary">Personalized for you</span>
                      {personalization.adaptations?.difficultyAdjusted !== undefined && personalization.adaptations.difficultyAdjusted !== 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Difficulty {personalization.adaptations.difficultyAdjusted > 0 ? '+' : ''}{personalization.adaptations.difficultyAdjusted}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{personalization.encouragementMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Personalized Summary */}
            {personalization.personalizedSummary && (
              <Card variant="bordered" className="mb-4 bg-secondary/5">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-secondary" />
                    Quick Summary
                  </h4>
                  <p className="text-sm text-foreground">{personalization.personalizedSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Module Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {currentModule.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {displayModule?.estimatedTime || currentModule.estimatedTime} min
                    </span>
                    {currentModule.isInteractive && (
                      <span className="flex items-center gap-1 text-primary">
                        <TrendingUp className="w-4 h-4" />
                        Interactive
                      </span>
                    )}
                    {personalization.isPersonalized && (
                      <span className="flex items-center gap-1 text-secondary">
                        <Sparkles className="w-4 h-4" />
                        Personalized
                      </span>
                    )}
                    {moduleScore !== null && (
                      <span className={`flex items-center gap-1 ${moduleScore >= 70 ? 'text-success' : 'text-warning'}`}>
                        <Trophy className="w-4 h-4" />
                        {moduleScore}%
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="p-2 rounded-lg hover:bg-border transition-colors"
                  title="Adjust learning preferences"
                >
                  <Settings2 className="w-5 h-5 text-muted" />
                </button>
              </div>
            </div>

            {/* Interactive Content Blocks */}
            {currentModule.isInteractive && displayModule?.contentBlocks && displayModule.contentBlocks.length > 0 ? (
              <div className="flex flex-col-reverse lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  {displayModule.contentBlocks
                    .sort((a, b) => a.order - b.order)
                    .map((block) => (
                      <ContentBlockRenderer
                        key={block.id}
                        block={block}
                        courseId={courseId}
                        moduleId={currentModule._id}
                        onInteractionSubmit={handleInteractionSubmit}
                        previousResponse={currentResponses.find((r) => r.blockId === block.id)}
                      />
                    ))}
                </div>
                <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
                  <InteractionProgress
                    contentBlocks={displayModule.contentBlocks}
                    responses={currentResponses}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Legacy Module Content */}
                <Card variant="bordered" className="mb-6">
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">
                        {currentModule.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Points */}
                {currentModule.aiGeneratedContent?.keyPoints && currentModule.aiGeneratedContent.keyPoints.length > 0 && (
                  <Card variant="bordered" className="mb-6">
                    <CardContent>
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-warning" />
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {currentModule.aiGeneratedContent.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Examples */}
                {currentModule.aiGeneratedContent?.examples && currentModule.aiGeneratedContent.examples.length > 0 && (
                  <Card variant="bordered" className="mb-6 bg-primary/5">
                    <CardContent>
                      <h3 className="font-semibold text-foreground mb-4">Examples</h3>
                      <div className="space-y-4">
                        {currentModule.aiGeneratedContent.examples.map((example, i) => (
                          <div key={i} className="p-3 bg-background rounded-lg">
                            <p className="text-foreground">{example}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setIsChatOpen(true)}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Ask AI Tutor
              </Button>
              <Button onClick={handleModuleComplete}>
                Mark as Complete
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-muted">Select a module to start learning</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <div className="w-96 border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">AI Tutor</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded hover:bg-border"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything about this module!</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-border text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isSendingMessage && (
              <div className="flex justify-start">
                <div className="bg-border rounded-lg p-3">
                  <Spinner size="sm" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isSendingMessage}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
