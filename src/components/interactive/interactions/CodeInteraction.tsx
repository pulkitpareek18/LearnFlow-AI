'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Code2,
  Play,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Terminal,
  Clock,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { CodeInteraction as CodeInteractionType, CodeResponse } from '@/types';

interface CodeInteractionProps {
  interaction: CodeInteractionType;
  onSubmit: (response: CodeResponse) => Promise<{
    isCorrect: boolean;
    score: number;
    maxScore: number;
    feedback: string;
    aiFeedback?: string;
    testResults?: {
      testCaseId: string;
      passed: boolean;
      actualOutput?: string;
      expectedOutput?: string;
      error?: string;
      executionTime?: number;
    }[];
  }>;
  disabled?: boolean;
  previousResponse?: CodeResponse;
}

const getLanguageLabel = (language: string) => {
  const labels: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust',
    html: 'HTML',
    css: 'CSS',
    sql: 'SQL',
  };
  return labels[language] || language;
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    case 'medium':
      return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    case 'hard':
      return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
    default:
      return 'text-muted bg-muted/10 border-muted/20';
  }
};

const getDifficultyLabel = (difficulty: string) => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

export default function CodeInteraction({
  interaction,
  onSubmit,
  disabled = false,
  previousResponse,
}: CodeInteractionProps) {
  const [code, setCode] = useState<string>(
    previousResponse?.code || interaction.starterCode || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    score: number;
    maxScore: number;
    feedback: string;
    aiFeedback?: string;
    testResults?: {
      testCaseId: string;
      passed: boolean;
      actualOutput?: string;
      expectedOutput?: string;
      error?: string;
      executionTime?: number;
    }[];
  } | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showTestCases, setShowTestCases] = useState(true);
  const [localTestOutput, setLocalTestOutput] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTestTab, setActiveTestTab] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current && !isExpanded) {
      const minHeight = 200;
      const maxHeight = 400;
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
    }
  }, [code, isExpanded]);

  // Handle code changes
  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCode(e.target.value);
    },
    []
  );

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset code to starter
  const handleResetCode = () => {
    setCode(interaction.starterCode || '');
  };

  // Run code locally (simulated)
  const handleRunCode = async () => {
    setIsRunning(true);
    setLocalTestOutput('Running tests...\n');

    setTimeout(() => {
      setLocalTestOutput(
        'Local preview not available.\nSubmit your code to run against test cases.'
      );
      setIsRunning(false);
    }, 500);
  };

  // Submit code for evaluation
  const handleSubmit = async () => {
    if (!code.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const response = await onSubmit({
        code,
        language: interaction.language,
      });
      setResult(response);
    } catch (error) {
      console.error('Error submitting code:', error);
      setResult({
        isCorrect: false,
        score: 0,
        maxScore: interaction.points,
        feedback: 'An error occurred while submitting your code. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show next hint
  const showNextHint = () => {
    if (interaction.hints && currentHintIndex < interaction.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  // Get visible test cases (non-hidden)
  const visibleTestCases = interaction.testCases.filter((tc) => !tc.isHidden);
  const hiddenCount = interaction.testCases.length - visibleTestCases.length;

  // Calculate test results summary
  const passedTests = result?.testResults?.filter((r) => r.passed).length || 0;
  const totalTests = result?.testResults?.length || interaction.testCases.length;

  return (
    <Card variant="bordered" className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 sm:px-6 sm:py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                Coding Challenge
              </h4>
              <p className="text-xs text-muted hidden sm:block">
                {interaction.points} points
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${getDifficultyColor(
                interaction.difficulty
              )}`}
            >
              {getDifficultyLabel(interaction.difficulty)}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {getLanguageLabel(interaction.language)}
            </span>
            {interaction.timeLimit && (
              <span className="text-xs px-2 py-1 rounded-full bg-surface-secondary text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {interaction.timeLimit}s
              </span>
            )}
            <span className="text-xs text-muted sm:hidden">
              {interaction.points} pts
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Problem Statement */}
        <div className="bg-surface-secondary rounded-lg p-3 sm:p-4">
          <h5 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Problem Statement
          </h5>
          <p className="text-foreground text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
            {interaction.prompt}
          </p>
        </div>

        {/* Test Cases Preview */}
        {visibleTestCases.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-surface-secondary hover:bg-surface-secondary/80 transition-colors"
              onClick={() => setShowTestCases(!showTestCases)}
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Test Cases
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {visibleTestCases.length}
                  {hiddenCount > 0 && ` + ${hiddenCount} hidden`}
                </span>
              </div>
              {showTestCases ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </button>

            {showTestCases && (
              <div className="border-t border-border">
                {/* Test Case Tabs (Mobile-friendly) */}
                <div className="flex overflow-x-auto scrollbar-hide border-b border-border bg-surface">
                  {visibleTestCases.map((testCase, index) => {
                    const testResult = result?.testResults?.find(
                      (r) => r.testCaseId === testCase.id
                    );
                    return (
                      <button
                        key={testCase.id}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTestTab === index
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted hover:text-foreground hover:bg-surface-secondary'
                        }`}
                        onClick={() => setActiveTestTab(index)}
                      >
                        {testResult && (
                          <span className="flex-shrink-0">
                            {testResult.passed ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                          </span>
                        )}
                        <span>Test {index + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Test Case Content */}
                {visibleTestCases[activeTestTab] && (
                  <div className="p-3 sm:p-4 space-y-3">
                    {visibleTestCases[activeTestTab].description && (
                      <p className="text-xs sm:text-sm text-muted">
                        {visibleTestCases[activeTestTab].description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs font-medium text-muted block mb-1.5">
                          Input
                        </span>
                        <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-mono overflow-x-auto max-h-24 scrollbar-thin">
                          {visibleTestCases[activeTestTab].input || '(no input)'}
                        </pre>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted block mb-1.5">
                          Expected Output
                        </span>
                        <pre className="bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-mono overflow-x-auto max-h-24 scrollbar-thin">
                          {visibleTestCases[activeTestTab].expectedOutput}
                        </pre>
                      </div>
                    </div>

                    {/* Test Result for Active Tab */}
                    {result?.testResults && (
                      <div className="space-y-2">
                        {(() => {
                          const testResult = result.testResults.find(
                            (r) => r.testCaseId === visibleTestCases[activeTestTab].id
                          );
                          if (!testResult) return null;

                          return (
                            <>
                              {testResult.actualOutput && (
                                <div>
                                  <span className="text-xs font-medium text-muted block mb-1.5">
                                    Your Output
                                  </span>
                                  <pre
                                    className={`rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-mono overflow-x-auto max-h-24 scrollbar-thin ${
                                      testResult.passed
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                    }`}
                                  >
                                    {testResult.actualOutput}
                                  </pre>
                                </div>
                              )}
                              {testResult.error && (
                                <div>
                                  <span className="text-xs font-medium text-rose-600 block mb-1.5">
                                    Error
                                  </span>
                                  <pre className="bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-mono overflow-x-auto max-h-24 scrollbar-thin">
                                    {testResult.error}
                                  </pre>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Code Editor */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e1e] border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-xs text-gray-400 font-mono ml-2">
                {getLanguageLabel(interaction.language).toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyCode}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleResetCode}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title="Reset to starter code"
                disabled={disabled || !!result}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                title={isExpanded ? 'Collapse editor' : 'Expand editor'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={handleCodeChange}
              onKeyDown={handleKeyDown}
              disabled={disabled || !!result}
              className={`w-full p-3 sm:p-4 font-mono text-xs sm:text-sm bg-[#1e1e1e] text-[#d4d4d4] focus:outline-none resize-none scrollbar-thin ${
                isExpanded ? 'h-[60vh] min-h-[400px]' : 'min-h-[200px]'
              } ${disabled || result ? 'opacity-70 cursor-not-allowed' : ''}`}
              placeholder={`// Write your ${getLanguageLabel(
                interaction.language
              )} code here...`}
              spellCheck={false}
            />
            <div className="absolute bottom-2 right-3 text-xs text-gray-500 pointer-events-none">
              {code.split('\n').length} lines
            </div>
          </div>
        </div>

        {/* Local Output */}
        {localTestOutput && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-surface-secondary border-b border-border">
              <span className="text-xs font-medium text-muted">Output</span>
            </div>
            <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-3 sm:p-4 text-xs sm:text-sm font-mono overflow-x-auto max-h-32 scrollbar-thin">
              {localTestOutput}
            </pre>
          </div>
        )}

        {/* Hints Section */}
        {interaction.hints && interaction.hints.length > 0 && !result && (
          <div>
            <button
              className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
              onClick={() => setShowHints(!showHints)}
            >
              <Lightbulb className="w-4 h-4" />
              {showHints ? 'Hide Hints' : 'Need a Hint?'}
            </button>
            {showHints && (
              <div className="mt-2 p-3 sm:p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Hint {currentHintIndex + 1}/{interaction.hints.length}:
                  </span>{' '}
                  {interaction.hints[currentHintIndex]}
                </p>
                {currentHintIndex < interaction.hints.length - 1 && (
                  <button
                    className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    onClick={showNextHint}
                  >
                    Show Next Hint ({currentHintIndex + 2}/{interaction.hints.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div
            className={`rounded-lg overflow-hidden border ${
              result.isCorrect
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-rose-500/5 border-rose-500/20'
            }`}
          >
            {/* Result Header */}
            <div
              className={`px-4 py-3 ${
                result.isCorrect ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {result.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                  <span
                    className={`font-semibold ${
                      result.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {result.isCorrect
                      ? 'All Tests Passed!'
                      : `${passedTests}/${totalTests} Tests Passed`}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    result.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-600'
                      : 'bg-rose-500/20 text-rose-600'
                  }`}
                >
                  {result.score}/{result.maxScore} points
                </span>
              </div>
            </div>

            {/* Result Body */}
            <div className="p-4 space-y-3">
              <p className="text-foreground text-sm">{result.feedback}</p>
              {result.aiFeedback && (
                <div className="p-3 bg-surface-secondary rounded-lg">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    AI Feedback
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {result.aiFeedback}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Concepts Assessed */}
        {interaction.conceptsAssessed && interaction.conceptsAssessed.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Concepts:</span>
            {interaction.conceptsAssessed.map((concept, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-surface-secondary rounded-full text-muted"
              >
                {concept}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {!result && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleRunCode}
              disabled={!code.trim() || isRunning || disabled}
              className="flex-1 order-2 sm:order-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!code.trim() || isSubmitting || disabled}
              className="flex-1 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                'Submit Solution'
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
