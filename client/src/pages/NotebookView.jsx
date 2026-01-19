import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Star, Trash2, Edit3, Loader, BookOpen, Calendar, Tag } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

// Markdown styles for summary
const markdownStyles = {
  container: { color: 'white', lineHeight: '1.8', fontSize: '18px' },
  h1: { fontSize: '28px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px', color: 'white' },
  h2: { fontSize: '24px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', color: 'white' },
  h3: { fontSize: '20px', fontWeight: '600', marginTop: '16px', marginBottom: '8px', color: 'white' },
  p: { marginBottom: '14px', lineHeight: '1.8', fontSize: '18px' },
  ul: { marginLeft: '24px', marginBottom: '14px', listStyleType: 'disc', fontSize: '18px' },
  ol: { marginLeft: '24px', marginBottom: '14px', listStyleType: 'decimal', fontSize: '18px' },
  li: { marginBottom: '8px', fontSize: '18px' },
  strong: { fontWeight: 'bold', color: '#22c55e' },
  em: { fontStyle: 'italic', color: '#a78bfa' },
  code: { backgroundColor: '#1a1a1a', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '16px', color: '#22c55e' },
  blockquote: { borderLeft: '4px solid #22c55e', paddingLeft: '16px', marginLeft: '0', color: '#9ca3af', fontStyle: 'italic', fontSize: '18px' }
};

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
  code: ({ children }) => <code style={markdownStyles.code}>{children}</code>,
  blockquote: ({ children }) => <blockquote style={markdownStyles.blockquote}>{children}</blockquote>
};

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function NotebookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/notebooks/${id}`, { withCredentials: true });
        if (response.data.success) {
          setNotebook(response.data.notebook);
        } else {
          setError('Notebook not found');
        }
      } catch (err) {
        console.error('Error fetching notebook:', err);
        setError('Failed to load notebook');
      } finally {
        setLoading(false);
      }
    };

    fetchNotebook();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this notebook?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/notebooks/${id}`, { withCredentials: true });
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Error deleting notebook:', err);
      alert('Failed to delete notebook');
    }
  };

  const handleToggleFeatured = async () => {
    try {
      const response = await axios.patch(`${API_URL}/api/notebooks/${id}/toggle-featured`, {}, { withCredentials: true });
      if (response.data.success) {
        setNotebook({ ...notebook, isFeatured: response.data.isFeatured });
      }
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '72px' }}>
        <Loader style={{ width: '48px', height: '48px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', paddingTop: '96px', padding: '96px 24px 32px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', color: 'white', marginBottom: '16px' }}>Notebook Not Found</h1>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>{error || 'This notebook does not exist.'}</p>
          <Link to="/app/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', paddingTop: '96px', padding: '96px 24px 32px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link to="/app/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#9ca3af', textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
            Back to Dashboard
          </Link>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>{notebook.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '14px' }}>
                  <Calendar style={{ width: '16px', height: '16px' }} />
                  {formatRelativeTime(notebook.createdAt)}
                </span>
                {notebook.category && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '14px' }}>
                    <Tag style={{ width: '16px', height: '16px' }} />
                    {notebook.category}
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleToggleFeatured}
                style={{
                  padding: '10px 16px',
                  backgroundColor: notebook.isFeatured ? '#f59e0b' : '#2a2a2a',
                  color: notebook.isFeatured ? 'white' : '#9ca3af',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Star style={{ width: '18px', height: '18px', fill: notebook.isFeatured ? 'currentColor' : 'none' }} />
                {notebook.isFeatured ? 'Featured' : 'Add to Featured'}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#2a2a2a',
                  color: '#ef4444',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 style={{ width: '18px', height: '18px' }} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '32px', border: '1px solid #333', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ width: '24px', height: '24px', color: '#22c55e' }} />
            Summary
          </h2>
          <div style={markdownStyles.container}>
            <ReactMarkdown components={MarkdownComponents}>
              {notebook.summary}
            </ReactMarkdown>
          </div>
        </div>

        {/* Original Text Section */}
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '32px', border: '1px solid #333' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>Original Text</h2>
          <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              {notebook.originalText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
