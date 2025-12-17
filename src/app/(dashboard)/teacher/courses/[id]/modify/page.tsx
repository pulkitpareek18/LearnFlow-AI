'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Code2,
  Github,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Spinner,
} from '@/components/ui';
import { CodeResource, ProgrammingLanguage } from '@/types';

const PROGRAMMING_LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

export default function ModifyCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modification prompt
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [modifications, setModifications] = useState<any[]>([]);

  // Code resources
  const [codeResources, setCodeResources] = useState<CodeResource[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);

  // Code question generation
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<ProgrammingLanguage[]>(['javascript', 'python']);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['implementation', 'completion']);

  useEffect(() => {
    fetchCourse();
    fetchCodeResources();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch course');
      }

      setCourse(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch course');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCodeResources = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/code-resources`);
      const result = await response.json();

      if (result.success) {
        setCodeResources(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch code resources:', err);
    }
  };

  const handleAddGithubResource = async () => {
    if (!githubUrl.trim()) return;

    setIsAddingResource(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/code-resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'github_file',
          url: githubUrl,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add code resource');
      }

      setCodeResources([...codeResources, result.data]);
      setGithubUrl('');
      setSuccess('Code resource added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add code resource');
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/code-resources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });

      setCodeResources(codeResources.filter((r) => r.id !== resourceId));
    } catch (err) {
      console.error('Failed to remove resource:', err);
    }
  };

  const handleModifyCourse = async (applyImmediately: boolean = false) => {
    if (!modificationPrompt.trim()) {
      setError('Please enter a modification prompt');
      return;
    }

    setIsModifying(true);
    setError('');
    setModifications([]);

    try {
      const response = await fetch(`/api/courses/${courseId}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: modificationPrompt,
          applyImmediately,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to modify course');
      }

      setModifications(result.data.modifications);
      if (applyImmediately) {
        setSuccess(`Applied ${result.data.modifications.length} modifications successfully!`);
        setModificationPrompt('');
        fetchCourse(); // Refresh course data
      } else {
        setSuccess('Modifications generated. Review and apply them below.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to modify course');
    } finally {
      setIsModifying(false);
    }
  };

  const handleGenerateCodeQuestions = async () => {
    if (codeResources.length === 0) {
      setError('Please add code resources first');
      return;
    }

    setIsGeneratingQuestions(true);
    setError('');

    try {
      const response = await fetch(`/api/courses/${courseId}/generate-code-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTypes,
          autoInsert: true,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate code questions');
      }

      setSuccess(result.message);
      fetchCourse(); // Refresh course data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/teacher/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Course
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Modify Course Content</h1>
        <p className="text-muted mt-2">{course?.title}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error text-error flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success text-success flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* AI Modification Prompt */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>Modify with AI</CardTitle>
            </div>
            <CardDescription>
              Describe what changes you want to make to your course content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full px-4 py-2.5 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-input-placeholder"
              rows={4}
              placeholder="Example: 'Add more interactive coding exercises to chapter 2', 'Include a debugging exercise after the functions module', 'Add explanatory text before each quiz'..."
              value={modificationPrompt}
              onChange={(e) => setModificationPrompt(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleModifyCourse(false)}
                variant="outline"
                disabled={isModifying || !modificationPrompt.trim()}
              >
                {isModifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Preview Changes'
                )}
              </Button>
              <Button
                onClick={() => handleModifyCourse(true)}
                disabled={isModifying || !modificationPrompt.trim()}
              >
                {isModifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </Button>
            </div>

            {/* Preview Modifications */}
            {modifications.length > 0 && (
              <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Proposed Modifications:</h4>
                <div className="space-y-2">
                  {modifications.map((mod, index) => (
                    <div
                      key={index}
                      className="p-3 bg-surface rounded border border-border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            mod.type === 'add'
                              ? 'bg-success/10 text-success'
                              : mod.type === 'modify'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {mod.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted">{mod.target}</span>
                      </div>
                      <p className="text-sm text-foreground">{mod.reason}</p>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-3"
                  onClick={() => handleModifyCourse(true)}
                  disabled={isModifying}
                >
                  Apply All Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code Resources */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-primary" />
              <CardTitle>Code Resources</CardTitle>
            </div>
            <CardDescription>
              Add code files from GitHub to generate coding exercises
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-input text-input-text border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://github.com/user/repo/blob/main/file.js"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <Button
                onClick={handleAddGithubResource}
                disabled={!githubUrl.trim() || isAddingResource}
              >
                {isAddingResource ? 'Adding...' : 'Add'}
              </Button>
            </div>

            {/* Added Resources */}
            {codeResources.length > 0 && (
              <div className="space-y-2">
                {codeResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Code2 className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {resource.fileName}
                        </p>
                        <p className="text-xs text-muted truncate max-w-[300px]">
                          {resource.url}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {resource.language}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveResource(resource.id)}
                      className="text-muted hover:text-error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Code Questions */}
        <Card variant="bordered">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              <CardTitle>Generate Code Questions</CardTitle>
            </div>
            <CardDescription>
              Automatically generate coding exercises from your code resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Question Types
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'implementation', label: 'Implementation' },
                  { value: 'debugging', label: 'Debugging' },
                  { value: 'completion', label: 'Completion' },
                  { value: 'review', label: 'Code Review' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      questionTypes.includes(type.value)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface border-border text-foreground hover:border-primary'
                    }`}
                    onClick={() => {
                      if (questionTypes.includes(type.value)) {
                        setQuestionTypes(questionTypes.filter((t) => t !== type.value));
                      } else {
                        setQuestionTypes([...questionTypes, type.value]);
                      }
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateCodeQuestions}
              disabled={isGeneratingQuestions || codeResources.length === 0}
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Code Questions
                </>
              )}
            </Button>

            {codeResources.length === 0 && (
              <p className="text-sm text-muted">
                Add code resources above to generate coding exercises.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
