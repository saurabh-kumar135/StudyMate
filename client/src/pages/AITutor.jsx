import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

// Custom styles for markdown rendering
const markdownStyles = {
  container: {
    color: 'var(--text-primary)',
    lineHeight: '1.7',
    fontSize: '16px'
  },
  h1: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '24px',
    marginBottom: '12px',
    color: 'var(--text-primary)'
  },
  h2: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '20px',
    marginBottom: '10px',
    color: 'var(--text-primary)'
  },
  h3: {
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '16px',
    marginBottom: '8px',
    color: 'var(--text-primary)'
  },
  p: {
    marginBottom: '12px',
    lineHeight: '1.7'
  },
  ul: {
    marginLeft: '24px',
    marginBottom: '12px',
    listStyleType: 'disc'
  },
  ol: {
    marginLeft: '24px',
    marginBottom: '12px',
    listStyleType: 'decimal'
  },
  li: {
    marginBottom: '6px',
    paddingLeft: '4px'
  },
  strong: {
    fontWeight: 'bold',
    color: '#60a5fa'
  },
  em: {
    fontStyle: 'italic',
    color: '#a78bfa'
  },
  code: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#22c55e'
  },
  pre: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '16px',
    borderRadius: '8px',
    overflow: 'auto',
    marginBottom: '12px',
    border: '1px solid var(--border-color)'
  },
  blockquote: {
    borderLeft: '4px solid #3b82f6',
    paddingLeft: '16px',
    marginLeft: '0',
    marginBottom: '12px',
    color: 'var(--text-secondary)',
    fontStyle: 'italic'
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #333',
    margin: '16px 0'
  }
};

// Custom markdown components
const MarkdownComponents = {
  h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
  h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
  h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
  p: ({ children }) => <p style={markdownStyles.p}>{children}</p>,
  ul: ({ children }) => <ul style={markdownStyles.ul}>{children}</ul>,
  ol: ({ children }) => <ol style={markdownStyles.ol}>{children}</ol>,
  li: ({ children }) => <li style={markdownStyles.li}>{children}</li>,
  strong: ({ children }) => <strong style={markdownStyles.strong}>{children}</strong>,
  em: ({ children }) => <em style={markdownStyles.em}>{children}</em>,
  code: ({ inline, children }) => 
    inline ? (
      <code style={markdownStyles.code}>{children}</code>
    ) : (
      <pre style={markdownStyles.pre}><code style={{ color: '#22c55e' }}>{children}</code></pre>
    ),
  blockquote: ({ children }) => <blockquote style={markdownStyles.blockquote}>{children}</blockquote>,
  hr: () => <hr style={markdownStyles.hr} />
};

export default function AITutor() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI tutor. Ask me anything about your studies! 📚'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, { question: userMessage });

      if (response.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t connect to the server. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingTop: '72px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px 16px 0 0', padding: '24px', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(to bottom right, #14b8a6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>AI Tutor</h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>Ask me anything about your studies</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '400px' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{ display: 'flex', gap: '12px', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}
            >
              {message.role === 'assistant' && (
                <div style={{ width: '36px', height: '36px', background: 'linear-gradient(to bottom right, #14b8a6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
                </div>
              )}
              
              <div style={{
                maxWidth: '75%',
                borderRadius: '16px',
                padding: message.role === 'user' ? '12px 16px' : '16px 20px',
                background: message.role === 'user' ? 'linear-gradient(to right, #14b8a6, #06b6d4)' : 'var(--bg-card)',
                border: message.role === 'assistant' ? '1px solid var(--border-color)' : 'none'
              }}>
                {message.role === 'assistant' ? (
                  <div style={markdownStyles.container}>
                    <ReactMarkdown components={MarkdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.5', color: 'var(--text-primary)' }}>{message.content}</p>
                )}
              </div>

              {message.role === 'user' && (
                <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--bg-card)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(to bottom right, #14b8a6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '16px 20px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader style={{ width: '20px', height: '20px', color: '#14b8a6', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '0 0 16px 16px', padding: '16px', borderTop: '1px solid #333' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your AI tutor..."
              disabled={loading}
              style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid #444', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding: '16px 24px',
                background: loading || !input.trim() ? 'var(--bg-card)' : 'linear-gradient(to right, #14b8a6, #06b6d4)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '500',
                fontSize: '16px'
              }}
            >
              <Send style={{ width: '20px', height: '20px' }} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
