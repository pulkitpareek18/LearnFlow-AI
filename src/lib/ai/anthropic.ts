import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Helper function to extract JSON from AI response (handles markdown code blocks and truncation)
function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Handle ```json ... ``` format - match both complete and incomplete code blocks
  // First try to match a complete code block
  const completeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (completeBlockMatch) {
    cleaned = completeBlockMatch[1].trim();
  } else {
    // If no complete block, try to extract content after ```json without closing ```
    const incompleteBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*)/);
    if (incompleteBlockMatch) {
      cleaned = incompleteBlockMatch[1].trim();
    }
  }

  // If still not valid JSON, try to find JSON object/array
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const jsonStart = cleaned.search(/[{\[]/);
    if (jsonStart !== -1) {
      cleaned = cleaned.substring(jsonStart);
    }
  }

  // Try to repair truncated JSON by finding the last valid closing bracket
  // and truncating there if needed
  cleaned = repairTruncatedJSON(cleaned);

  return cleaned;
}

// Helper function to attempt to repair truncated JSON
function repairTruncatedJSON(json: string): string {
  // First, try parsing as-is
  try {
    JSON.parse(json);
    return json;
  } catch {
    // JSON is invalid, try to repair it
  }

  // Count brackets to find imbalance
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }

  // If we're inside a string, close it
  if (inString) {
    json += '"';
  }

  // Add missing closing brackets/braces
  // Close any open arrays first, then objects
  while (bracketCount > 0) {
    json += ']';
    bracketCount--;
  }
  while (braceCount > 0) {
    json += '}';
    braceCount--;
  }

  // Try to parse again after repair
  try {
    JSON.parse(json);
    return json;
  } catch {
    // If still invalid, try a more aggressive approach:
    // Find the last valid JSON-like structure by working backwards
    return tryFindValidJSONEnd(json);
  }
}

// Try to find a valid JSON ending by working backwards
function tryFindValidJSONEnd(json: string): string {
  // Start from the end and try to find a valid JSON by removing characters
  // This is a last-resort approach for severely truncated responses

  // First, look for common truncation patterns and try to complete them
  // Remove trailing incomplete values
  let cleaned = json
    .replace(/,\s*$/, '') // Remove trailing comma
    .replace(/:\s*$/, ': null') // Complete trailing colon with null
    .replace(/"\s*$/, '"') // Ensure string is closed
    .replace(/,\s*"\w+"\s*$/, ''); // Remove incomplete key-value start

  // Count and fix brackets again
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
    }
  }

  // Close brackets
  while (bracketCount > 0) {
    cleaned += ']';
    bracketCount--;
  }
  while (braceCount > 0) {
    cleaned += '}';
    braceCount--;
  }

  return cleaned;
}

export interface GeneratedChapter {
  title: string;
  summary: string;
  content: string;
  order: number;
}

export interface GeneratedModule {
  title: string;
  content: string;
  keyPoints: string[];
  examples: string[];
  estimatedTime: number;
  order: number;
}

export interface GeneratedAssessment {
  question: string;
  type: 'mcq' | 'short' | 'long';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  points: number;
}

export async function generateCourseStructure(
  rawContent: string,
  courseTitle: string
): Promise<GeneratedChapter[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert educational content creator. Analyze the following content and create a structured course outline with chapters.

Course Title: ${courseTitle}

Content to analyze:
${rawContent.substring(0, 15000)} ${rawContent.length > 15000 ? '... (content truncated)' : ''}

Create 3-7 chapters that logically organize this content. For each chapter, provide:
1. A clear, descriptive title
2. A brief summary (2-3 sentences)
3. The key content/topics covered

Respond in valid JSON format only:
{
  "chapters": [
    {
      "title": "Chapter title",
      "summary": "Brief summary of what this chapter covers",
      "content": "Main content topics for this chapter",
      "order": 1
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return parsed.chapters;
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to parse course structure');
  }
}

export async function generateModulesForChapter(
  chapterTitle: string,
  chapterContent: string,
  courseContext: string
): Promise<GeneratedModule[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert educational content creator. Create detailed learning modules for a chapter.

Course Context: ${courseContext}
Chapter Title: ${chapterTitle}
Chapter Content/Topics: ${chapterContent}

Create 2-5 modules for this chapter. Each module should:
1. Cover a specific topic or concept
2. Include engaging, educational content
3. Have key learning points
4. Include practical examples
5. Estimate time needed (in minutes)

Respond in valid JSON format only:
{
  "modules": [
    {
      "title": "Module title",
      "content": "Detailed educational content for this module (2-4 paragraphs)",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "examples": ["Example 1", "Example 2"],
      "estimatedTime": 15,
      "order": 1
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return parsed.modules;
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to parse modules');
  }
}

export async function generateAssessment(
  moduleTitle: string,
  moduleContent: string,
  keyPoints: string[],
  questionCount: number = 5
): Promise<GeneratedAssessment[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert assessment creator. Create quiz questions for a learning module.

Module Title: ${moduleTitle}
Module Content: ${moduleContent}
Key Points: ${keyPoints.join(', ')}

Create ${questionCount} assessment questions. Include a mix of:
- Multiple choice questions (MCQ) with 4 options
- Short answer questions
- At least one conceptual question

For each question provide:
1. The question text
2. Question type (mcq, short, or long)
3. For MCQ: 4 options (one correct)
4. The correct answer
5. An explanation of why the answer is correct
6. Difficulty level (1-5)
7. Points (10-20 based on difficulty)

Respond in valid JSON format only:
{
  "questions": [
    {
      "question": "Question text",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why this is correct",
      "difficulty": 2,
      "points": 10
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return parsed.questions;
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to parse assessment');
  }
}

export async function chatWithTutor(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  moduleContext: string,
  studentQuestion: string
): Promise<string> {
  const systemPrompt = `You are an AI tutor helping a student learn. You have access to the following module content:

${moduleContext}

Guidelines:
- Be encouraging and supportive
- Explain concepts clearly with examples
- If asked about something not in the content, acknowledge it and try to help based on general knowledge
- Ask follow-up questions to ensure understanding
- Keep responses concise but informative`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: studentQuestion },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return textContent.text;
}

// ==========================================
// Interactive Learning AI Functions
// ==========================================

import { ContentBlock, LearningOutcome, AdaptiveRecommendation, LearningPreferences } from '@/types';

export interface GeneratedInteractiveContent {
  contentBlocks: ContentBlock[];
  totalPoints: number;
  estimatedTime: number;
}

/**
 * Generate interactive module content with text blocks and interactions
 */
export async function generateInteractiveModuleContent(
  moduleTitle: string,
  rawContent: string,
  courseContext: string,
  learningOutcomes: string[],
  difficultyLevel: number = 5,
  interactionFrequency: 'low' | 'medium' | 'high' = 'medium'
): Promise<GeneratedInteractiveContent> {
  const frequencyGuide = {
    low: 'Add 1-2 interactions for the entire module',
    medium: 'Add an interaction after every major concept (3-5 interactions)',
    high: 'Add frequent interactions throughout (5-8 interactions, after every 1-2 paragraphs)',
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are an expert educational content creator specializing in interactive learning. Transform the following content into an engaging, interactive learning module.

Module Title: ${moduleTitle}
Course Context: ${courseContext}
Learning Outcomes to address: ${learningOutcomes.join(', ')}
Difficulty Level: ${difficultyLevel}/10
Interaction Frequency: ${interactionFrequency} - ${frequencyGuide[interactionFrequency]}

Raw Content:
${rawContent.substring(0, 12000)}${rawContent.length > 12000 ? '... (content truncated)' : ''}

Create an array of content blocks that alternate between educational text and interactive elements. Each block should either be:
1. TEXT BLOCK: Educational content explaining concepts
2. INTERACTION BLOCK: One of these types:
   - MCQ: Multiple choice question to test understanding (10 points)
   - FILL_BLANK: Fill in the blank exercise for terminology (10 points)
   - REFLECTION: Open-ended question for deeper thinking (15 points)
   - REVEAL: Click-to-reveal additional information (0 points, not graded)
   - CONFIRM: Self-assessment checkpoint (0 points, not graded)

Guidelines:
- Start with a text block introducing the topic
- Place interactions after explaining a concept to reinforce learning
- Use MCQs for factual knowledge checks
- Use fill_blank for important terminology
- Use reflections for critical thinking
- Use reveal for optional "learn more" content
- End with a confirm block for self-assessment
- Assign unique conceptKey to each block (e.g., "concept_variables", "concept_loops")
- Mark graded interactions as isRequired: true

Respond in valid JSON format only:
{
  "contentBlocks": [
    {
      "id": "block_1",
      "order": 1,
      "type": "text",
      "content": "Educational text content...",
      "conceptKey": "concept_intro"
    },
    {
      "id": "block_2",
      "order": 2,
      "type": "interaction",
      "interaction": {
        "type": "mcq",
        "question": "Question text?",
        "options": [
          { "id": "opt_1", "text": "Option A", "isCorrect": false, "feedback": "Incorrect because..." },
          { "id": "opt_2", "text": "Option B", "isCorrect": true, "feedback": "Correct! This is right because..." },
          { "id": "opt_3", "text": "Option C", "isCorrect": false, "feedback": "Not quite..." },
          { "id": "opt_4", "text": "Option D", "isCorrect": false, "feedback": "This is incorrect..." }
        ],
        "explanation": "The correct answer is B because...",
        "points": 10
      },
      "conceptKey": "concept_basics",
      "isRequired": true
    },
    {
      "id": "block_3",
      "order": 3,
      "type": "interaction",
      "interaction": {
        "type": "fill_blank",
        "text": "A {{blank_1}} is a container that stores data, and you can change its {{blank_2}} during program execution.",
        "blanks": [
          { "id": "blank_1", "correctAnswer": "variable", "acceptableAnswers": ["var"], "hint": "Think about what holds data" },
          { "id": "blank_2", "correctAnswer": "value", "acceptableAnswers": ["content", "data"], "hint": "What can change?" }
        ],
        "points": 10
      },
      "conceptKey": "concept_terminology",
      "isRequired": true
    },
    {
      "id": "block_4",
      "order": 4,
      "type": "interaction",
      "interaction": {
        "type": "reflection",
        "prompt": "How would you apply this concept in a real-world scenario? Provide a specific example.",
        "rubric": "Student should demonstrate understanding by providing a relevant example with clear explanation of the concept application.",
        "minWords": 30,
        "maxWords": 200,
        "points": 15
      },
      "conceptKey": "concept_application",
      "isRequired": true
    },
    {
      "id": "block_5",
      "order": 5,
      "type": "interaction",
      "interaction": {
        "type": "reveal",
        "buttonText": "Learn More: Advanced Topic",
        "revealedContent": "Additional information..."
      },
      "conceptKey": "concept_advanced",
      "isRequired": false
    },
    {
      "id": "block_6",
      "order": 6,
      "type": "interaction",
      "interaction": {
        "type": "confirm",
        "statement": "I understand the core concepts covered in this module",
        "options": [
          { "text": "Yes, I understand completely", "value": "fully" },
          { "text": "I understand most of it", "value": "partially" },
          { "text": "I need to review this again", "value": "not_yet" }
        ]
      },
      "conceptKey": "concept_checkpoint",
      "isRequired": false
    }
  ],
  "totalPoints": 45,
  "estimatedTime": 20
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return {
      contentBlocks: parsed.contentBlocks,
      totalPoints: parsed.totalPoints || 0,
      estimatedTime: parsed.estimatedTime || 15,
    };
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to parse interactive content');
  }
}

/**
 * Generate learning outcomes for a course
 */
export async function generateLearningOutcomes(
  courseTitle: string,
  courseDescription: string,
  rawContent: string
): Promise<LearningOutcome[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert instructional designer. Create measurable learning outcomes for a course.

Course Title: ${courseTitle}
Course Description: ${courseDescription}

Course Content Summary:
${rawContent.substring(0, 8000)}${rawContent.length > 8000 ? '... (content truncated)' : ''}

Create 5-10 specific, measurable learning outcomes. Each outcome should:
1. Start with an action verb (Bloom's Taxonomy): Understand, Apply, Analyze, Evaluate, Create, etc.
2. Be specific and measurable
3. Be achievable within the course scope
4. Cover different levels of cognitive complexity

Respond in valid JSON format only:
{
  "outcomes": [
    {
      "id": "outcome_1",
      "description": "Understand the fundamental concepts of...",
      "aiSuggested": true,
      "teacherApproved": false,
      "order": 1,
      "relatedModules": []
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return parsed.outcomes;
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to parse learning outcomes');
  }
}

export interface ReflectionGrade {
  score: number;
  maxScore: number;
  feedback: string;
  suggestions: string[];
  strengthAreas: string[];
}

/**
 * Grade a student's reflection response using AI
 */
export async function gradeReflectionResponse(
  prompt: string,
  studentResponse: string,
  rubric: string,
  maxPoints: number
): Promise<ReflectionGrade> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert educator grading a student's reflection response. Be fair, encouraging, and constructive.

Reflection Prompt: ${prompt}

Grading Rubric: ${rubric}

Maximum Points: ${maxPoints}

Student's Response:
"${studentResponse}"

Grade this response based on:
1. Understanding of the concept (40%)
2. Quality of example/application (30%)
3. Clarity of explanation (20%)
4. Depth of thinking (10%)

Provide:
1. A fair score out of ${maxPoints}
2. Constructive feedback explaining the grade
3. Specific suggestions for improvement
4. Areas where the student showed strength

Be encouraging even when giving lower scores. Focus on growth.

Respond in valid JSON format only:
{
  "score": 12,
  "maxScore": ${maxPoints},
  "feedback": "Your response shows good understanding...",
  "suggestions": ["Consider adding...", "Try to explain..."],
  "strengthAreas": ["Good use of examples", "Clear explanation"]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    return JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to grade reflection');
  }
}

export interface AdaptiveContentResult {
  additionalExamples?: string[];
  simplifiedExplanation?: string;
  reviewRecommendations?: string[];
  difficultyAdjustment: number;
  message: string;
}

/**
 * Generate adaptive content recommendations based on student performance
 */
export async function generateAdaptiveContent(
  moduleContent: string,
  studentPerformance: {
    accuracy: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    strugglingConcepts: string[];
    correctStreak: number;
    incorrectStreak: number;
  }
): Promise<AdaptiveContentResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an adaptive learning system. Based on a student's performance, provide personalized learning recommendations.

Module Content Summary:
${moduleContent.substring(0, 4000)}

Student Performance:
- Accuracy: ${studentPerformance.accuracy}%
- Recent Trend: ${studentPerformance.recentTrend}
- Struggling Concepts: ${studentPerformance.strugglingConcepts.join(', ') || 'None identified'}
- Correct answers in a row: ${studentPerformance.correctStreak}
- Incorrect answers in a row: ${studentPerformance.incorrectStreak}

Based on this performance, provide adaptive recommendations:

Rules:
- accuracy < 50% → Decrease difficulty by -2, provide simplified explanations
- accuracy 50-70% → Provide additional examples, slight difficulty decrease -1
- accuracy 70-90% → Maintain current level, stable difficulty 0
- accuracy > 90% with improving trend → Increase difficulty +2
- 3+ incorrect streak → Force review, provide extra help
- 5+ correct streak → Challenge with harder content, increase +1

Respond in valid JSON format only:
{
  "additionalExamples": ["Example 1 explained simply...", "Another way to think about this..."],
  "simplifiedExplanation": "Let me explain this concept more simply...",
  "reviewRecommendations": ["Review the section on...", "Practice more with..."],
  "difficultyAdjustment": -1,
  "message": "Encouraging message based on performance..."
}

Only include fields that are relevant based on performance. For high performers, don't include simplifiedExplanation.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    return JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to generate adaptive content');
  }
}

/**
 * Get adaptive recommendations based on student progress
 */
export async function getAdaptiveRecommendations(
  studentMetrics: {
    accuracy: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    conceptsMastered: string[];
    conceptsStruggling: string[];
    correctStreak: number;
    incorrectStreak: number;
  },
  availableModules: Array<{ id: string; title: string; difficultyLevel: number }>
): Promise<AdaptiveRecommendation[]> {
  const recommendations: AdaptiveRecommendation[] = [];

  // Rule-based recommendations
  if (studentMetrics.incorrectStreak >= 3) {
    recommendations.push({
      type: 'slow_down',
      message: "Let's take a step back and review some concepts. It's okay to take your time!",
      relatedConceptKeys: studentMetrics.conceptsStruggling,
    });
  }

  if (studentMetrics.accuracy < 50) {
    recommendations.push({
      type: 'simplify',
      message: "I'll provide simpler explanations to help you understand better.",
      relatedConceptKeys: studentMetrics.conceptsStruggling,
    });
  } else if (studentMetrics.accuracy < 70) {
    recommendations.push({
      type: 'extra_examples',
      message: 'Here are some additional examples to help reinforce these concepts.',
      relatedConceptKeys: studentMetrics.conceptsStruggling,
    });
  }

  if (studentMetrics.conceptsStruggling.length > 0) {
    recommendations.push({
      type: 'review',
      message: `Consider reviewing these concepts: ${studentMetrics.conceptsStruggling.join(', ')}`,
      relatedConceptKeys: studentMetrics.conceptsStruggling,
    });
  }

  if (studentMetrics.accuracy >= 90 && studentMetrics.recentTrend === 'improving') {
    recommendations.push({
      type: 'speed_up',
      message: "Excellent progress! You're ready for more challenging content.",
    });
  }

  if (studentMetrics.correctStreak >= 5) {
    recommendations.push({
      type: 'challenge',
      message: "You're on a roll! Let's try something more challenging.",
      suggestedModuleIds: availableModules
        .filter((m) => m.difficultyLevel > 5)
        .slice(0, 2)
        .map((m) => m.id),
    });
  }

  return recommendations;
}

/**
 * Personalize module content based on student preferences and previous performance
 */
export interface PersonalizedContentResult {
  personalizedBlocks: ContentBlock[];
  adaptations: {
    contentDepthAdjusted: boolean;
    examplesAdded: boolean;
    analogiesIncluded: boolean;
    difficultyAdjusted: number;
    interactionFrequencyAdjusted: boolean;
  };
  personalizedSummary?: string;
  encouragementMessage: string;
}

export async function generatePersonalizedModuleContent(
  moduleTitle: string,
  originalBlocks: ContentBlock[],
  moduleContent: string,
  studentPreferences: LearningPreferences,
  previousPerformance: {
    accuracy: number;
    recentTrend: 'improving' | 'stable' | 'declining';
    strugglingConcepts: string[];
    masteredConcepts: string[];
    averageTimePerInteraction: number;
    currentDifficultyLevel: number;
  }
): Promise<PersonalizedContentResult> {
  // Build preference description for the AI
  const preferenceDescription = `
Student Learning Preferences:
- Learning Pace: ${studentPreferences.preferredPace} (${studentPreferences.preferredPace === 'slow' ? 'needs more time and thorough explanations' : studentPreferences.preferredPace === 'fast' ? 'quick learner, prefers concise content' : 'balanced pace'})
- Learning Style: ${studentPreferences.learningStyle} (${studentPreferences.learningStyle === 'visual' ? 'learns best with diagrams and visual aids' : studentPreferences.learningStyle === 'interactive' ? 'learns best through hands-on practice' : 'prefers reading and text-based learning'})
- Content Depth: ${studentPreferences.contentDepth}
- Examples: Prefers ${studentPreferences.preferExamples} examples
- Analogies: ${studentPreferences.preferAnalogies ? 'Likes real-world analogies' : 'Prefers direct explanations'}
- Visual Aids: ${studentPreferences.preferVisualAids ? 'Include visual descriptions' : 'Text is sufficient'}
- Summaries: ${studentPreferences.preferSummaries ? 'Include section summaries' : 'Skip summaries'}
- Interaction Frequency: ${studentPreferences.interactionFrequency}
- Feedback Style: ${studentPreferences.feedbackStyle}
- Show Hints: ${studentPreferences.showHintsFirst ? 'Show hints before answering' : 'No hints needed initially'}
- Challenge Level: ${studentPreferences.challengeLevel}
- Skip Mastered Content: ${studentPreferences.skipMasteredContent}`;

  const performanceDescription = `
Student Performance (from previous module):
- Accuracy: ${previousPerformance.accuracy}%
- Recent Trend: ${previousPerformance.recentTrend}
- Struggling Concepts: ${previousPerformance.strugglingConcepts.length > 0 ? previousPerformance.strugglingConcepts.join(', ') : 'None'}
- Mastered Concepts: ${previousPerformance.masteredConcepts.length > 0 ? previousPerformance.masteredConcepts.join(', ') : 'None yet'}
- Current Difficulty Level: ${previousPerformance.currentDifficultyLevel}/10`;

  // Determine content adaptations based on preferences and performance
  let difficultyAdjustment = 0;
  if (previousPerformance.accuracy < 50) {
    difficultyAdjustment = -2;
  } else if (previousPerformance.accuracy < 70) {
    difficultyAdjustment = -1;
  } else if (previousPerformance.accuracy > 90 && previousPerformance.recentTrend === 'improving') {
    difficultyAdjustment = studentPreferences.challengeLevel === 'challenging' ? 2 : 1;
  }

  // Adjust based on challenge preference
  if (studentPreferences.challengeLevel === 'comfortable' && difficultyAdjustment > 0) {
    difficultyAdjustment = 0;
  } else if (studentPreferences.challengeLevel === 'challenging' && difficultyAdjustment < 0) {
    difficultyAdjustment = Math.max(difficultyAdjustment, -1);
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are an adaptive learning AI that personalizes educational content based on individual student needs.

Module Title: ${moduleTitle}

Original Module Content:
${moduleContent.substring(0, 6000)}

${preferenceDescription}

${performanceDescription}

TASK: Adapt the following content blocks to match this student's learning style and address their performance:

Original Content Blocks:
${JSON.stringify(originalBlocks.slice(0, 15), null, 2)}

Adaptation Guidelines:
1. CONTENT DEPTH:
   - If student prefers "concise": Shorten explanations, remove redundancy
   - If student prefers "comprehensive": Add more detail, context, and nuance

2. EXAMPLES (student wants ${studentPreferences.preferExamples}):
   - Add/modify examples to match this preference
   - If struggling concepts exist, add targeted examples for those areas

3. ANALOGIES (student ${studentPreferences.preferAnalogies ? 'likes' : 'dislikes'} analogies):
   - ${studentPreferences.preferAnalogies ? 'Include relatable real-world analogies' : 'Use direct, technical explanations'}

4. LEARNING STYLE (${studentPreferences.learningStyle}):
   - Visual: Add descriptive visual language, describe diagrams, use spatial metaphors
   - Interactive: Add more practice-focused content, hands-on scenarios
   - Reading: Focus on clear text explanations with proper structure

5. DIFFICULTY ADJUSTMENT (${difficultyAdjustment > 0 ? '+' + difficultyAdjustment : difficultyAdjustment}):
   - ${difficultyAdjustment < 0 ? 'Simplify language, break down complex concepts' : difficultyAdjustment > 0 ? 'Add more challenging questions, deeper concepts' : 'Maintain current difficulty'}

6. INTERACTION FREQUENCY (${studentPreferences.interactionFrequency}):
   - Low: Keep only essential knowledge checks
   - Medium: Balance between content and interactions
   - High: Add more frequent check-ins and practice

7. STRUGGLING CONCEPTS (${previousPerformance.strugglingConcepts.join(', ') || 'None'}):
   - Add extra explanations and examples for these areas
   - Include targeted review content

8. MASTERED CONCEPTS (${previousPerformance.masteredConcepts.join(', ') || 'None'}):
   ${studentPreferences.skipMasteredContent ? '- Briefly summarize or skip these areas' : '- Include quick refreshers'}

9. FEEDBACK STYLE (${studentPreferences.feedbackStyle}):
   - Update interaction feedback to match: ${studentPreferences.feedbackStyle === 'encouraging' ? 'warm, supportive tone' : studentPreferences.feedbackStyle === 'direct' ? 'straightforward, to the point' : 'thorough explanations'}

10. HINTS (${studentPreferences.showHintsFirst}):
   - ${studentPreferences.showHintsFirst ? 'Make hints more visible, add more hints' : 'Keep hints as optional reveals'}

Respond in valid JSON format:
{
  "personalizedBlocks": [
    // Modified content blocks with adaptations applied
  ],
  "adaptations": {
    "contentDepthAdjusted": true,
    "examplesAdded": true,
    "analogiesIncluded": false,
    "difficultyAdjusted": ${difficultyAdjustment},
    "interactionFrequencyAdjusted": false
  },
  "personalizedSummary": "Brief summary of key concepts for this module (if student prefers summaries)",
  "encouragementMessage": "A personalized, ${studentPreferences.feedbackStyle} message based on their performance and progress"
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return {
      personalizedBlocks: parsed.personalizedBlocks || originalBlocks,
      adaptations: parsed.adaptations || {
        contentDepthAdjusted: false,
        examplesAdded: false,
        analogiesIncluded: false,
        difficultyAdjusted: difficultyAdjustment,
        interactionFrequencyAdjusted: false,
      },
      personalizedSummary: studentPreferences.preferSummaries ? parsed.personalizedSummary : undefined,
      encouragementMessage: parsed.encouragementMessage || 'Keep up the great work!',
    };
  } catch (error) {
    console.error('Failed to parse personalized content:', textContent.text);
    // Return original blocks if personalization fails
    return {
      personalizedBlocks: originalBlocks,
      adaptations: {
        contentDepthAdjusted: false,
        examplesAdded: false,
        analogiesIncluded: false,
        difficultyAdjusted: 0,
        interactionFrequencyAdjusted: false,
      },
      encouragementMessage: 'Keep learning!',
    };
  }
}

/**
 * Generate a quick content adaptation without full regeneration
 * Used for real-time adjustments based on immediate performance
 */
export async function generateQuickAdaptation(
  currentBlock: ContentBlock,
  isStruggling: boolean,
  studentPreferences: Pick<LearningPreferences, 'learningStyle' | 'feedbackStyle' | 'preferExamples'>
): Promise<{ additionalContent?: string; hint?: string; simplifiedVersion?: string }> {
  if (!isStruggling) {
    return {};
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `A student is struggling with this content. Provide quick help.

Content Block:
${JSON.stringify(currentBlock, null, 2)}

Student prefers: ${studentPreferences.learningStyle} learning, ${studentPreferences.feedbackStyle} feedback, ${studentPreferences.preferExamples} examples.

Provide:
1. A simplified version of the concept
2. An additional helpful hint
3. ${studentPreferences.preferExamples === 'extensive' ? 'An extra example' : 'Brief clarification'}

Respond in JSON:
{
  "simplifiedVersion": "Simpler explanation...",
  "hint": "Helpful hint...",
  "additionalContent": "Extra example or clarification..."
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    return {};
  }

  try {
    const jsonText = extractJSON(textContent.text);
    return JSON.parse(jsonText);
  } catch {
    return {};
  }
}

/**
 * Generate multi-modal content representations for different learning styles
 */
import { ContentFormat, MultiModalContent, LearningStyle } from '@/types';

export async function generateMultiModalContent(
  originalContent: string,
  conceptKey: string,
  targetFormats: ContentFormat[]
): Promise<MultiModalContent> {
  const formatInstructions = targetFormats.map((format) => {
    switch (format) {
      case 'text':
        return 'text: Standard text explanation with clear structure';
      case 'visual':
        return 'visual: A visual representation (diagram/infographic/flowchart/mindmap) with detailed description and optional SVG content';
      case 'audio_description':
        return 'audioDescription: Text optimized for audio/screen readers - conversational, clear, with pronunciation guidance';
      case 'interactive':
        return 'interactive: Interactive element configuration (simulation/drag_drop/timeline)';
      default:
        return '';
    }
  }).filter(Boolean).join('\n   - ');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert educational content creator specializing in multi-modal learning. Transform the following content into different formats to support various learning styles.

Original Content:
${originalContent}

Concept Key: ${conceptKey}

Create the content in these formats:
   - ${formatInstructions}

Guidelines for each format:

1. TEXT FORMAT:
   - Clear, structured text explanation
   - Use headings, bullet points, and paragraphs
   - Include examples and context
   - Professional but accessible language

2. VISUAL FORMAT:
   - Choose the most appropriate type: diagram, infographic, flowchart, or mindmap
   - Provide a detailed description of what the visual would show
   - If possible, include simple SVG content for basic diagrams
   - Describe spatial relationships, colors, and key elements
   - Make it easy to visualize mentally

3. AUDIO DESCRIPTION FORMAT:
   - Conversational, narrative style
   - Spell out acronyms first time used
   - Provide pronunciation guidance for technical terms
   - Use transitions and signposts ("First...", "Next...", "Finally...")
   - Avoid relying on visual references
   - Natural pacing and rhythm

4. INTERACTIVE FORMAT:
   - Design an interactive element: simulation, drag-and-drop, or timeline
   - Provide configuration with clear structure
   - Include steps, elements, or data points
   - Make it engaging and educational

Learning Style Recommendations:
- TEXT: Best for reading/writing learners
- VISUAL: Best for visual learners
- AUDIO_DESCRIPTION: Best for auditory learners and accessibility
- INTERACTIVE: Best for kinesthetic/interactive learners

Respond in valid JSON format:
{
  "id": "${conceptKey}_multimodal",
  "moduleId": "to_be_set",
  "conceptKey": "${conceptKey}",
  "formats": {
    "text": "Clear structured text...",
    "visual": {
      "type": "diagram",
      "description": "Detailed description of the visual representation...",
      "svgContent": "<svg>...</svg> or null if not applicable"
    },
    "audioDescription": "Conversational audio-friendly text...",
    "interactive": {
      "type": "simulation",
      "config": {
        "title": "Interactive Title",
        "description": "What the interaction does",
        "elements": [...],
        "steps": [...]
      }
    }
  },
  "preferredFor": ["visual", "reading", "interactive"]
}

Only include the formats requested. If a format is not in the target list, omit it from the response.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);

    // Ensure only requested formats are included
    const filteredFormats: any = {};
    if (targetFormats.includes('text') && parsed.formats.text) {
      filteredFormats.text = parsed.formats.text;
    }
    if (targetFormats.includes('visual') && parsed.formats.visual) {
      filteredFormats.visual = parsed.formats.visual;
    }
    if (targetFormats.includes('audio_description') && parsed.formats.audioDescription) {
      filteredFormats.audioDescription = parsed.formats.audioDescription;
    }
    if (targetFormats.includes('interactive') && parsed.formats.interactive) {
      filteredFormats.interactive = parsed.formats.interactive;
    }

    return {
      id: parsed.id || `${conceptKey}_multimodal`,
      moduleId: parsed.moduleId || 'to_be_set',
      conceptKey: parsed.conceptKey || conceptKey,
      formats: filteredFormats,
      preferredFor: parsed.preferredFor || ['reading'],
    };
  } catch (error) {
    console.error('Failed to parse AI response:', textContent.text);
    throw new Error('Failed to parse multi-modal content');
  }
}

/**
 * Grade a student's code submission using AI
 */
export interface CodeGradeResult {
  feedback: string;
  suggestions: string[];
  codeQualityNotes: string[];
  codeQualityScore: number; // 0-1
  testResults: {
    testCaseId: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput: string;
    error?: string;
    executionTime?: number;
  }[];
}

export async function gradeCodeResponse(
  prompt: string,
  studentCode: string,
  language: string,
  solutionCode: string | undefined,
  testCases: { id: string; input: string; expectedOutput: string; isHidden: boolean; description?: string }[],
  rubric: string | undefined,
  maxPoints: number
): Promise<CodeGradeResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert code reviewer and grader. Evaluate the following code submission.

Problem Statement:
${prompt}

Programming Language: ${language}

Student's Code:
\`\`\`${language}
${studentCode}
\`\`\`

${solutionCode ? `Reference Solution:
\`\`\`${language}
${solutionCode}
\`\`\`
` : ''}

Test Cases:
${testCases.map((tc, i) => `Test ${i + 1}${tc.description ? ` (${tc.description})` : ''}:
  Input: ${tc.input || '(no input)'}
  Expected Output: ${tc.expectedOutput}`).join('\n')}

${rubric ? `Grading Rubric:
${rubric}` : ''}

Maximum Points: ${maxPoints}

Please evaluate the code and provide:
1. Run each test case mentally/logically and determine if the code would produce the expected output
2. Code quality assessment (style, readability, efficiency, best practices)
3. Constructive feedback for the student
4. Specific suggestions for improvement

Be fair but thorough. Consider:
- Correctness: Does the code solve the problem?
- Efficiency: Is the solution reasonably efficient?
- Style: Does it follow good coding practices for ${language}?
- Edge cases: Are potential edge cases handled?

Respond in valid JSON format:
{
  "feedback": "Overall feedback about the submission...",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "codeQualityNotes": ["Note about code quality 1", "Note 2"],
  "codeQualityScore": 0.8,
  "testResults": [
    {
      "testCaseId": "test_id",
      "passed": true,
      "actualOutput": "What the code would output",
      "expectedOutput": "Expected output",
      "error": null,
      "executionTime": 10
    }
  ]
}

Important: Simulate running the code logically for each test case. Don't actually execute code, but reason through what the output would be.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    return JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse AI code grade response:', textContent.text);
    // Return a default response if parsing fails
    return {
      feedback: 'Your code has been reviewed. Please check the test results below.',
      suggestions: ['Consider reviewing your solution for potential improvements.'],
      codeQualityNotes: ['Code quality assessment is pending.'],
      codeQualityScore: 0.5,
      testResults: testCases.map((tc) => ({
        testCaseId: tc.id,
        passed: false,
        expectedOutput: tc.expectedOutput,
        error: 'Unable to evaluate',
      })),
    };
  }
}

/**
 * Generate code-based questions from code files or GitHub content
 */
export interface GeneratedCodeQuestion {
  prompt: string;
  language: string;
  starterCode?: string;
  solutionCode: string;
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    description?: string;
  }[];
  hints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  conceptsAssessed: string[];
  points: number;
  relatedModuleKeywords: string[];
}

export async function generateCodeQuestionsFromContent(
  codeContent: string,
  language: string,
  moduleTopics: string[],
  questionTypes: ('implementation' | 'debugging' | 'completion' | 'review')[],
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 3
): Promise<GeneratedCodeQuestion[]> {
  const questionTypeDescriptions = {
    implementation: 'Write a complete function/solution from scratch',
    debugging: 'Find and fix bugs in the given code',
    completion: 'Complete partially written code',
    review: 'Review code and answer questions about it',
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are an expert programming instructor. Generate ${count} coding exercises based on the following code content.

Code Content (${language}):
\`\`\`${language}
${codeContent.substring(0, 10000)}${codeContent.length > 10000 ? '\n... (truncated)' : ''}
\`\`\`

Related Module Topics: ${moduleTopics.join(', ')}

Question Types to Generate: ${questionTypes.map(t => `${t} (${questionTypeDescriptions[t]})`).join(', ')}

Difficulty Level: ${difficulty}

Create ${count} coding questions that:
1. Are inspired by or related to the code content above
2. Test understanding of the concepts shown
3. Match the specified difficulty level
4. Cover the question types requested

For each question, provide:
- A clear problem statement/prompt
- Starter code (if applicable)
- A reference solution
- 3-5 test cases (mix of visible and hidden)
- 2-3 hints
- Concepts being assessed
- Keywords to help map to related modules

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks or other formatting.
{
  "questions": [
    {
      "prompt": "Clear problem description...",
      "language": "${language}",
      "starterCode": "// Optional starter template",
      "solutionCode": "// Complete solution",
      "testCases": [
        {
          "id": "test_1",
          "input": "input value",
          "expectedOutput": "expected result",
          "isHidden": false,
          "description": "Tests basic functionality"
        }
      ],
      "hints": ["Hint 1", "Hint 2"],
      "difficulty": "${difficulty}",
      "conceptsAssessed": ["loops", "arrays"],
      "points": 20,
      "relatedModuleKeywords": ["arrays", "iteration", "data structures"]
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return parsed.questions;
  } catch (parseError) {
    console.error('Failed to parse AI code questions response.');
    console.error('Parse error:', parseError);
    console.error('Raw response length:', textContent.text.length);
    console.error('Response preview:', textContent.text.substring(0, 500) + '...');
    console.error('Response end:', '...' + textContent.text.substring(textContent.text.length - 200));
    // Return empty array instead of throwing to allow partial success
    return [];
  }
}

/**
 * Map generated code questions to relevant course modules
 */
export async function mapCodeQuestionsToModules(
  questions: GeneratedCodeQuestion[],
  modules: { id: string; title: string; content: string; keyPoints?: string[] }[]
): Promise<{ questionIndex: number; moduleId: string; relevanceScore: number }[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert curriculum designer. Map the following code questions to the most relevant course modules.

Code Questions:
${questions.map((q, i) => `Question ${i + 1}:
  Prompt: ${q.prompt.substring(0, 200)}...
  Concepts: ${q.conceptsAssessed.join(', ')}
  Keywords: ${q.relatedModuleKeywords.join(', ')}`).join('\n\n')}

Available Modules:
${modules.map((m, i) => `Module ${i + 1} (ID: ${m.id}):
  Title: ${m.title}
  Content Summary: ${m.content.substring(0, 300)}...
  Key Points: ${m.keyPoints?.join(', ') || 'N/A'}`).join('\n\n')}

For each question, determine which module it best fits into based on:
1. Concept alignment
2. Topic relevance
3. Difficulty progression

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks or other formatting.
{
  "mappings": [
    {
      "questionIndex": 0,
      "moduleId": "module_id",
      "relevanceScore": 0.9
    }
  ]
}`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    const parsed = JSON.parse(jsonText);
    return parsed.mappings;
  } catch {
    console.error('Failed to parse module mappings:', textContent.text);
    // Return default mappings (first module for all)
    return questions.map((_, i) => ({
      questionIndex: i,
      moduleId: modules[0]?.id || '',
      relevanceScore: 0.5,
    }));
  }
}

/**
 * Modify course content based on teacher prompt
 */
export async function modifyCourseContentWithPrompt(
  currentContent: any, // Current course structure with chapters/modules
  teacherPrompt: string,
  teacherInstructions: any
): Promise<{
  modifications: {
    type: 'add' | 'modify' | 'remove';
    target: 'chapter' | 'module' | 'interaction';
    targetId?: string;
    changes: any;
    reason: string;
  }[];
  summary: string;
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `You are an expert curriculum designer. The teacher wants to modify their course content.

Current Course Structure:
${JSON.stringify(currentContent, null, 2).substring(0, 8000)}

Teacher's Modification Request:
"${teacherPrompt}"

Additional Teacher Instructions/Preferences:
${JSON.stringify(teacherInstructions, null, 2)}

Based on the teacher's request, determine what modifications should be made to the course.

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks or other formatting.

{
  "modifications": [
    {
      "type": "add",
      "target": "interaction",
      "targetId": "module_id_to_add_to",
      "changes": {
        "contentBlock": {
          "id": "new_block_id",
          "type": "interaction",
          "interaction": {
            "type": "code",
            "prompt": "...",
            "language": "python",
            ...
          }
        }
      },
      "reason": "Adding code exercise as requested"
    }
  ],
  "summary": "Summary of all modifications made"
}

Types of modifications:
- add: Add new content (chapter, module, or interaction)
- modify: Change existing content
- remove: Remove content

Be specific about what should change and provide the actual content for additions.`,
      },
    ],
  });

  const textContent = response.content[0];
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonText = extractJSON(textContent.text);
    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Failed to parse course modifications.');
    console.error('Parse error:', parseError);
    console.error('Raw response length:', textContent.text.length);
    console.error('Response preview:', textContent.text.substring(0, 500) + '...');
    console.error('Response end:', '...' + textContent.text.substring(textContent.text.length - 200));
    // Return empty modifications instead of throwing to provide graceful failure
    return {
      modifications: [],
      summary: 'Failed to parse AI response. Please try again with a simpler request.',
    };
  }
}

export default anthropic;
