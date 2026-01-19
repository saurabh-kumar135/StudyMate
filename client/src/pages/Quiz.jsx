import { useState } from 'react';
import axios from 'axios';
import { Trophy, Loader, Sparkles, CheckCircle, XCircle, Brain } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export default function Quiz() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/quiz`, {
        topic,
        numQuestions,
        difficulty
      });

      if (response.data.success) {
        setQuestions(response.data.questions);
        setQuizStarted(true);
        setCurrentQuestion(0);
        setSelectedAnswers({});
        setShowResults(false);
      } else {
        alert('Failed to generate quiz. Please try again.');
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubmitQuiz = async () => {
    setShowResults(true);
    // Track quiz completion
    try {
      await axios.post(`${API_URL}/api/user/increment-quiz`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleRestart = () => {
    setQuizStarted(false);
    setQuestions([]);
    setTopic('');
    setSelectedAnswers({});
    setShowResults(false);
  };

  // Quiz Setup Screen
  if (!quizStarted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingTop: '96px', padding: '96px 24px 32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy style={{ width: '32px', height: '32px', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Generate Quiz</h1>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '18px' }}>Test your knowledge with AI-generated questions</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Topic Input */}
              <div>
                <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                  Quiz Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War 2, Python Programming"
                  style={{ width: '100%', padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid #444', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Number of Questions */}
              <div>
                <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                  Number of Questions: {numQuestions}
                </label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#3b82f6' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  <span>3</span>
                  <span>10</span>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                  Difficulty Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        fontSize: '16px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: difficulty === level ? 'linear-gradient(to right, #3b82f6, #06b6d4)' : 'var(--bg-card)',
                        color: difficulty === level ? 'white' : '#9ca3af'
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateQuiz}
                disabled={loading || !topic.trim()}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: loading || !topic.trim() ? 'var(--bg-card)' : 'linear-gradient(to right, #3b82f6, #06b6d4)',
                  color: 'var(--text-primary)',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '18px',
                  fontWeight: '500'
                }}
              >
                {loading ? (
                  <>
                    <Loader style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: '20px', height: '20px' }} />
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingTop: '96px', padding: '96px 24px 32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '96px', height: '96px', background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Trophy style={{ width: '48px', height: '48px', color: 'var(--text-primary)' }} />
            </div>
            
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Quiz Complete!</h1>
            <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Here are your results</p>

            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
                {score}/{questions.length}
              </div>
              <div style={{ fontSize: '24px', color: '#d1d5db' }}>
                {percentage}% Correct
              </div>
            </div>

            {/* Answer Review */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {questions.map((q, index) => {
                const isCorrect = selectedAnswers[index] === q.correctAnswer;
                return (
                  <div key={index} style={{ textAlign: 'left', padding: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                      {isCorrect ? (
                        <CheckCircle style={{ width: '24px', height: '24px', color: '#22c55e', flexShrink: 0, marginTop: '4px' }} />
                      ) : (
                        <XCircle style={{ width: '24px', height: '24px', color: '#ef4444', flexShrink: 0, marginTop: '4px' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>{q.question}</p>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: '500' }}>Correct Answer:</span> {q.options[q.correctAnswer]}
                        </p>
                        {q.explanation && (
                          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                            <span style={{ fontWeight: '500' }}>Explanation:</span> {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRestart}
              style={{ padding: '16px 32px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'var(--text-primary)', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking Screen
  const currentQ = questions[currentQuestion];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingTop: '96px', padding: '96px 24px 32px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Object.keys(selectedAnswers).length} answered</span>
          </div>
          <div style={{ width: '100%', backgroundColor: 'var(--bg-card)', borderRadius: '9999px', height: '8px' }}>
            <div
              style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4)', height: '8px', borderRadius: '9999px', transition: 'all 0.3s', width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{currentQ.question}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(currentQuestion, index)}
                style={{
                  width: '100%',
                  padding: '16px',
                  textAlign: 'left',
                  borderRadius: '12px',
                  border: selectedAnswers[currentQuestion] === index ? '2px solid #3b82f6' : '2px solid #333',
                  backgroundColor: selectedAnswers[currentQuestion] === index ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontWeight: '500' }}>{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            style={{ padding: '16px 24px', backgroundColor: currentQuestion === 0 ? '#333' : '#2a2a2a', color: currentQuestion === 0 ? '#666' : '#d1d5db', borderRadius: '12px', border: 'none', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: '500' }}
          >
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              style={{ padding: '16px 24px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'var(--text-primary)', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              style={{ padding: '16px 24px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'var(--text-primary)', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
