/**
 * Gemini AI Service
 * Handles all AI-related functionality for StudyMate
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Tutor Chat - Answer student questions
 */
async function chatWithAI(question, context = '') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a helpful AI tutor for students. 
${context ? `Context: ${context}\n\n` : ''}
Student Question: ${question}

Provide a clear, educational answer that helps the student understand the concept. 
Use examples when helpful. Keep the tone friendly and encouraging.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      answer: response.text()
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const lengthInstructions = {
      short: 'in 2-3 sentences',
      medium: 'in 1-2 paragraphs',
      long: 'in 3-4 paragraphs with key points'
    };
    
    const prompt = `Summarize the following text ${lengthInstructions[summaryLength] || lengthInstructions.medium}:

${text}

Provide a clear, concise summary that captures the main ideas and key points.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      summary: response.text()
    };
  } catch (error) {
    console.error('Summarization Error:', error);
    return {
      success: false,
      error: 'Failed to summarize text. Please try again.'
    };
  }
}

/**
 * Generate Quiz - Create practice questions from study material
 */
async function generateQuiz(topic, numQuestions = 5, difficulty = 'medium') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `Generate ${numQuestions} multiple-choice quiz questions about: ${topic}

Difficulty level: ${difficulty}

Format each question as JSON with this structure:
{
  "question": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct"
}

Return a JSON array of questions. Make questions educational and test understanding, not just memorization.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Parse the JSON response
    const text = response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        questions
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const levelInstructions = {
      beginner: 'Explain in simple terms suitable for someone new to this topic. Use analogies and examples.',
      intermediate: 'Provide a detailed explanation with technical details and examples.',
      advanced: 'Give an in-depth explanation with advanced concepts, edge cases, and real-world applications.'
    };
    
    const prompt = `Explain the concept: ${concept}

Level: ${level}
${levelInstructions[level] || levelInstructions.beginner}

Include:
1. Clear definition
2. Key points
3. Practical examples
4. Common misconceptions (if any)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      explanation: response.text()
    };
  } catch (error) {
    console.error('Concept Explanation Error:', error);
    return {
      success: false,
      error: 'Failed to explain concept. Please try again.'
    };
  }
}

module.exports = {
  chatWithAI,
  summarizeText,
  generateQuiz,
  explainConcept
};
