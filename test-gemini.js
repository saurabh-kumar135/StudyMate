
require('dotenv').config();
const { chatWithAI, summarizeText, generateQuiz, explainConcept } = require('./utils/geminiService');

console.log('='.repeat(70));
console.log('STUDYMATE - GEMINI AI TEST');
console.log('='.repeat(70));

async function testAI() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('\n❌ ERROR: GEMINI_API_KEY not found in .env file!');
    console.log('\n📝 To fix this:');
    console.log('1. Go to: https://aistudio.google.com/apikey');
    console.log('2. Create an API key');
    console.log('3. Add to .env file: GEMINI_API_KEY=your_key_here\n');
    process.exit(1);
  }

  console.log('\n✅ API Key found!\n');

  console.log('Test 1: AI Tutor Chat');
  console.log('-'.repeat(70));
  const chatResult = await chatWithAI('What is photosynthesis?');
  if (chatResult.success) {
    console.log('✅ Chat working!');
    console.log('Answer:', chatResult.answer.substring(0, 200) + '...\n');
  } else {
    console.log('❌ Chat failed:', chatResult.error, '\n');
  }

  console.log('Test 2: Text Summarization');
  console.log('-'.repeat(70));
  const longText = `Photosynthesis is a process used by plants and other organisms to convert 
light energy into chemical energy that, through cellular respiration, can later be released to 
fuel the organism's activities. This chemical energy is stored in carbohydrate molecules, such 
as sugars and starches, which are synthesized from carbon dioxide and water.`;
  
  const summaryResult = await summarizeText(longText, 'short');
  if (summaryResult.success) {
    console.log('✅ Summarization working!');
    console.log('Summary:', summaryResult.summary, '\n');
  } else {
    console.log('❌ Summarization failed:', summaryResult.error, '\n');
  }

  console.log('Test 3: Quiz Generation');
  console.log('-'.repeat(70));
  const quizResult = await generateQuiz('Photosynthesis', 2, 'easy');
  if (quizResult.success) {
    console.log('✅ Quiz generation working!');
    console.log('Generated', quizResult.questions.length, 'questions');
    console.log('Sample question:', quizResult.questions[0].question, '\n');
  } else {
    console.log('❌ Quiz generation failed:', quizResult.error, '\n');
  }

  console.log('Test 4: Concept Explanation');
  console.log('-'.repeat(70));
  const explainResult = await explainConcept('Mitochondria', 'beginner');
  if (explainResult.success) {
    console.log('✅ Concept explanation working!');
    console.log('Explanation:', explainResult.explanation.substring(0, 200) + '...\n');
  } else {
    console.log('❌ Concept explanation failed:', explainResult.error, '\n');
  }

  console.log('='.repeat(70));
  console.log('✅ ALL TESTS COMPLETE!');
  console.log('='.repeat(70));
  console.log('\nYour StudyMate AI is ready to use! 🎉\n');
}

testAI().catch(error => {
  console.error('\n❌ Test failed with error:', error.message);
  console.log('\nPlease check:');
  console.log('1. GEMINI_API_KEY is set in .env');
  console.log('2. API key is valid');
  console.log('3. Internet connection is working\n');
});
