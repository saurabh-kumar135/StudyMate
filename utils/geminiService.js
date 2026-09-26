/**
 * Gemini AI Service with Resilient Multi-Model Fallback
 * Handles all AI-related functionality for StudyMate
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAIInstance = null;

function getGenAI() {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('GEMINI_API_KEY environment variable is not defined.');
    }
    genAIInstance = new GoogleGenerativeAI(key || '');
  }
  return genAIInstance;
}

// Cascading models in order of capability and availability
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview'
];

/**
 * Executes a Gemini prompt with automatic retry and model fallback
 */
async function generateWithFallback(prompt) {
  const client = getGenAI();
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return { success: true, text: text.trim(), modelUsed: modelName };
        }
      } catch (err) {
        lastError = err;
        console.warn('Gemini attempt failed for ' + modelName + ' (attempt ' + (attempt + 1) + '): ' + err.message);
        // Short pause before next attempt
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  throw lastError || new Error('All Gemini models are currently unavailable. Please try again.');
}

/**
 * AI Tutor Chat - Answer student questions
 */
async function chatWithAI(question, context = '') {
  try {
    const prompt = 'You are a helpful AI tutor for students.\n' +
      (context ? 'Context: ' + context + '\n\n' : '') +
      'Student Question: ' + question + '\n\n' +
      'Provide a clear, educational answer that helps the student understand the concept.\n' +
      'Use examples when helpful. Keep the tone friendly and encouraging.';

    const result = await generateWithFallback(prompt);
    return {
      success: true,
      answer: result.text,
      modelUsed: result.modelUsed
    };
  } catch (error) {
    console.error('AI Chat Error:', error);
    return {
      success: false,
      error: 'Failed to get AI response. Please try again.'
    };
  }
}

/**
 * Summarize Text - Create concise summaries of study materials
 */
async function summarizeText(text, summaryLength = 'medium') {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        success: false,
        error: 'Please provide valid text to summarize.'
      };
    }

    const lengthInstructions = {
      short: 'in 2-3 sentences',
      medium: 'in 1-2 paragraphs',
      long: 'in 3-4 paragraphs with key points'
    };

    // Protect against huge texts that exceed input token window
    const maxChars = 40000;
    const sanitizedText = text.length > maxChars ? text.slice(0, maxChars) + '\n[Truncated for length]' : text;

    const prompt = 'Summarize the following text ' + (lengthInstructions[summaryLength] || lengthInstructions.medium) + ':\n\n' +
      sanitizedText + '\n\n' +
      'Provide a clear, concise summary that captures the main ideas and key points.';

    const result = await generateWithFallback(prompt);
    return {
      success: true,
      summary: result.text,
      modelUsed: result.modelUsed
    };
  } catch (error) {
    console.error('Summarization Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to summarize text. Please try again.'
    };
  }
}

/**
 * Generate Quiz - Create practice questions from study material
 */
async function generateQuiz(topic, numQuestions = 5, difficulty = 'medium') {
  try {
    const prompt = 'Generate ' + numQuestions + ' multiple-choice quiz questions about: ' + topic + '\n\n' +
      'Difficulty level: ' + difficulty + '\n\n' +
      'Format each question as JSON with this structure:\n' +
      '{\n' +
      '  "question": "Question text",\n' +
      '  "options": ["Option A", "Option B", "Option C", "Option D"],\n' +
      '  "correctAnswer": 0,\n' +
      '  "explanation": "Why this answer is correct"\n' +
      '}\n\n' +
      'Return a JSON array of questions. Make questions educational and test understanding, not just memorization.';

    const result = await generateWithFallback(prompt);
    const text = result.text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        questions,
        modelUsed: result.modelUsed
      };
    }

    return {
      success: false,
      error: 'Failed to parse quiz questions'
    };
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return {
      success: false,
      error: 'Failed to generate quiz. Please try again.'
    };
  }
}

/**
 * Explain Concept - Provide detailed explanations with examples
 */
async function explainConcept(concept, level = 'beginner') {
  try {
    const levelInstructions = {
      beginner: 'Explain in simple terms suitable for someone new to this topic. Use analogies and examples.',
      intermediate: 'Provide a detailed explanation with technical details and examples.',
      advanced: 'Give an in-depth explanation with advanced concepts, edge cases, and real-world applications.'
    };

    const prompt = 'Explain the concept: ' + concept + '\n\n' +
      'Level: ' + level + '\n' +
      (levelInstructions[level] || levelInstructions.beginner) + '\n\n' +
      'Include:\n' +
      '1. Clear definition\n' +
      '2. Key points\n' +
      '3. Practical examples\n' +
      '4. Common misconceptions (if any)';

    const result = await generateWithFallback(prompt);
    return {
      success: true,
      explanation: result.text,
      modelUsed: result.modelUsed
    };
  } catch (error) {
    console.error('Concept Explanation Error:', error);
    return {
      success: false,
      error: 'Failed to explain concept. Please try again.'
    };
  }
}

/**
 * Summarize Live Study Call Transcript
 */
async function summarizeStudySession(transcriptText, topic = 'General Study Session') {
  try {
    const prompt = 'You are an expert AI Academic Assistant for StudyMate.\n' +
      'Analyze the following transcript from a live study session between student(s) and teacher(s) on the topic "' + topic + '".\n\n' +
      'Transcript:\n' + transcriptText + '\n\n' +
      'Please provide a well-structured JSON response with the following structure:\n' +
      '{\n' +
      '  "summary": "Concise 2-3 paragraph summary of the session",\n' +
      '  "keyConcepts": ["Concept 1 with short explanation", "Concept 2 with short explanation"],\n' +
      '  "actionItems": ["Action item or homework 1", "Action item 2"],\n' +
      '  "flashcards": [\n' +
      '    { "question": "Question 1", "answer": "Answer 1" },\n' +
      '    { "question": "Question 2", "answer": "Answer 2" }\n' +
      '  ]\n' +
      '}';

    const result = await generateWithFallback(prompt);
    const text = result.text;
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed, modelUsed: result.modelUsed };
    } catch (parseErr) {
      return { success: true, data: { summary: text, keyConcepts: [], actionItems: [], flashcards: [] }, modelUsed: result.modelUsed };
    }
  } catch (error) {
    console.error('Session Summarization Error:', error);
    return {
      success: false,
      error: 'Failed to generate AI study session summary.'
    };
  }
}

module.exports = {
  chatWithAI,
  summarizeText,
  generateQuiz,
  explainConcept,
  summarizeStudySession
};
