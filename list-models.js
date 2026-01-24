
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Fetching available models...\n');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.models) {
      console.log('✅ Available models:');
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
        console.log(`    Display Name: ${model.displayName}`);
        console.log(`    Supported: ${model.supportedGenerationMethods?.join(', ')}\n`);
      });
    } else {
      console.log('❌ No models found or error:', data);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
