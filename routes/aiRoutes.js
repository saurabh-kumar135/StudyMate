/**
 * AI Routes - Handles all AI-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { chatWithAI, summarizeText, generateQuiz, explainConcept } = require('../utils/geminiService');
// const { requireAuth } = require('../middleware/auth'); // TODO: Add auth middleware later

/**
 * POST /api/ai/chat
 * Chat with AI tutor
 */
router.post('/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }
    
    const result = await chatWithAI(question, context);
    res.json(result);
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/ai/summarize
 * Summarize text
 */
router.post('/summarize', async (req, res) => {
  try {
    const { text, length } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const result = await summarizeText(text, length);
    res.json(result);
  } catch (error) {
    console.error('Summarize API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/ai/quiz
 * Generate quiz questions
 */
router.post('/quiz', async (req, res) => {
  try {
    const { topic, numQuestions, difficulty } = req.body;
    
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }
    
    const result = await generateQuiz(topic, numQuestions, difficulty);
    res.json(result);
  } catch (error) {
    console.error('Quiz API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/ai/explain
 * Explain a concept
 */
router.post('/explain', async (req, res) => {
  try {
    const { concept, level } = req.body;
    
    if (!concept) {
      return res.status(400).json({
        success: false,
        error: 'Concept is required'
      });
    }
    
    const result = await explainConcept(concept, level);
    res.json(result);
  } catch (error) {
    console.error('Explain API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
