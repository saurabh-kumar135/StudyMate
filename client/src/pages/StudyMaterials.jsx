import { useState, useRef } from 'react';
import axios from 'axios';
import { FileText, Upload, Loader, Sparkles, BookOpen, File, CheckCircle, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

// Markdown styles for summary - increased font sizes
const markdownStyles = {
  container: { color: 'var(--text-primary)', lineHeight: '1.8', fontSize: '18px' },
  h1: { fontSize: '28px', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px', color: 'var(--text-primary)' },
  h2: { fontSize: '24px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px', color: 'var(--text-primary)' },
  h3: { fontSize: '20px', fontWeight: '600', marginTop: '16px', marginBottom: '8px', color: 'var(--text-primary)' },
  p: { marginBottom: '14px', lineHeight: '1.8', fontSize: '18px' },
  ul: { marginLeft: '24px', marginBottom: '14px', listStyleType: 'disc', fontSize: '18px' },
  ol: { marginLeft: '24px', marginBottom: '14px', listStyleType: 'decimal', fontSize: '18px' },
  li: { marginBottom: '8px', fontSize: '18px' },
  strong: { fontWeight: 'bold', color: '#22c55e' },
  em: { fontStyle: 'italic', color: '#a78bfa' },
  code: { backgroundColor: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '16px', color: '#22c55e' },
  blockquote: { borderLeft: '4px solid #22c55e', paddingLeft: '16px', marginLeft: '0', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '18px' }
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

// Extract title from text content
const extractTitle = (text) => {
  // Try to find a title from the first line
  const lines = text.trim().split('\n');
  const firstLine = lines[0].replace(/^[#\-*]+\s*/, '').trim();
  if (firstLine.length > 0 && firstLine.length < 100) {
    return firstLine.substring(0, 50);
  }
  // Fallback to first few words
  const words = text.trim().split(/\s+/).slice(0, 5).join(' ');
  return words.length > 50 ? words.substring(0, 50) : words;
};

// Detect category from content
const detectCategory = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('cell') || lowerText.includes('mitosis') || lowerText.includes('biology') || lowerText.includes('organism')) {
    return 'Biology';
  }
  if (lowerText.includes('chemistry') || lowerText.includes('molecule') || lowerText.includes('atom') || lowerText.includes('chemical')) {
    return 'Chemistry';
  }
  if (lowerText.includes('physics') || lowerText.includes('force') || lowerText.includes('energy') || lowerText.includes('motion')) {
    return 'Physics';
  }
  if (lowerText.includes('math') || lowerText.includes('equation') || lowerText.includes('calculus') || lowerText.includes('algebra')) {
    return 'Mathematics';
  }
  if (lowerText.includes('history') || lowerText.includes('war') || lowerText.includes('civilization') || lowerText.includes('century')) {
    return 'History';
  }
  if (lowerText.includes('computer') || lowerText.includes('programming') || lowerText.includes('code') || lowerText.includes('software')) {
    return 'Computer Science';
  }
  return 'General';
};

export default function StudyMaterials() {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF or TXT files only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post(`${API_URL}/api/materials/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setText(response.data.text);
        setUploadedFile(response.data.filename);
        setSummary('');
        setNotebookTitle(response.data.filename.replace(/\.[^/.]+$/, ''));
      } else {
        alert(response.data.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading document. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSummarize = async () => {
    if (!text.trim()) {
      alert('Please enter some text or upload a document');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/summarize`, { text, length: summaryLength });
      if (response.data.success) {
        setSummary(response.data.summary);
        // Auto-generate title if not set
        if (!notebookTitle) {
          setNotebookTitle(extractTitle(text));
        }
      } else {
        alert('Failed to summarize text. Please try again.');
      }
    } catch (error) {
      console.error('Summarization error:', error);
      alert('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotebook = async () => {
    if (!summary) {
      alert('Please summarize the text first');
      return;
    }

    const titleToSave = notebookTitle.trim() || extractTitle(text);
    
    setSaving(true);
    try {
      const response = await axios.post(`${API_URL}/api/notebooks`, {
        title: titleToSave,
        originalText: text,
        summary: summary,
        summaryLength: summaryLength,
        category: detectCategory(text),
        sourceType: uploadedFile ? 'file' : 'text',
        sourceFileName: uploadedFile || null
      }, { withCredentials: true });

      if (response.data.success) {
        setShowSaveDialog(false);
        alert('Notebook saved successfully!');
        // Navigate to the saved notebook
        navigate(`/app/notebook/${response.data.notebook._id}`);
      } else {
        alert('Failed to save notebook. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving notebook. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
    setUploadedFile(null);
    setNotebookTitle('');
    setShowSaveDialog(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingTop: '96px', padding: '96px 16px 32px 16px' }}>
      {/* Header - Full Width */}
      <div style={{ marginBottom: '28px', paddingLeft: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(to bottom right, #22c55e, #10b981)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: '32px', height: '32px', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Study Materials</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '18px' }}>Upload documents or paste text to summarize</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Full Width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Input Section */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <FileText style={{ width: '24px', height: '24px', color: '#22c55e' }} />
              Your Text
            </h2>
            <button onClick={handleClear} style={{ padding: '8px 16px', fontSize: '16px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
              Clear
            </button>
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '16px' }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
            <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', width: '100%', padding: '20px', border: '2px dashed #444', borderRadius: '12px', cursor: 'pointer', backgroundColor: 'var(--bg-card)', boxSizing: 'border-box' }}>
              {uploading ? (
                <>
                  <Loader style={{ width: '24px', height: '24px', color: '#22c55e', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload style={{ width: '24px', height: '24px', color: '#22c55e' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500', margin: 0, fontSize: '18px' }}>Upload Document</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>PDF or TXT (Max 10MB)</p>
                  </div>
                </>
              )}
            </label>

            {uploadedFile && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                <File style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                <span style={{ fontSize: '16px', color: 'var(--text-primary)', flex: 1 }}>{uploadedFile}</span>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>OR</div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your study material here..."
            style={{ width: '100%', height: '220px', padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid #444', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '16px', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: '1.6' }}
          />

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: '500', color: '#d1d5db', marginBottom: '10px' }}>Summary Length</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['short', 'medium', 'long'].map((length) => (
                <button
                  key={length}
                  onClick={() => setSummaryLength(length)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: '500',
                    fontSize: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    background: summaryLength === length ? 'linear-gradient(to right, #22c55e, #10b981)' : 'var(--bg-card)',
                    color: summaryLength === length ? 'white' : '#9ca3af'
                  }}
                >
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={loading || !text.trim()}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '18px',
              background: loading || !text.trim() ? 'var(--bg-card)' : 'linear-gradient(to right, #22c55e, #10b981)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              border: 'none',
              cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '18px',
              fontWeight: '600'
            }}
          >
            {loading ? (
              <>
                <Loader style={{ width: '22px', height: '22px', animation: 'spin 1s linear infinite' }} />
                Summarizing...
              </>
            ) : (
              <>
                <Sparkles style={{ width: '22px', height: '22px' }} />
                Summarize with AI
              </>
            )}
          </button>
        </div>

        {/* Summary Section */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Sparkles style={{ width: '24px', height: '24px', color: '#10b981' }} />
              AI Summary
            </h2>
            {summary && (
              <button
                onClick={() => setShowSaveDialog(true)}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Save style={{ width: '18px', height: '18px' }} />
                Save as Notebook
              </button>
            )}
          </div>

          {summary ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={markdownStyles.container}>
                <ReactMarkdown components={MarkdownComponents}>
                  {summary}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <Upload style={{ width: '56px', height: '56px', margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '20px', margin: '0 0 8px 0' }}>Your summary will appear here</p>
                <p style={{ fontSize: '16px', margin: 0 }}>Upload a document or paste text, then click "Summarize with AI"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px' }}>Save Notebook</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '16px', color: '#d1d5db', marginBottom: '8px' }}>Notebook Title</label>
              <input
                type="text"
                value={notebookTitle}
                onChange={(e) => setNotebookTitle(e.target.value)}
                placeholder="Enter a title for your notebook..."
                style={{ width: '100%', padding: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid #444', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '16px', color: '#d1d5db', marginBottom: '8px' }}>Category (auto-detected)</label>
              <input
                type="text"
                value={detectCategory(text)}
                disabled
                style={{ width: '100%', padding: '14px', backgroundColor: 'var(--bg-card)', border: '1px solid #444', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{ flex: 1, padding: '14px', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotebook}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: saving ? '#444' : 'linear-gradient(to right, #22c55e, #10b981)',
                  color: 'var(--text-primary)',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {saving ? (
                  <>
                    <Loader style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '18px', height: '18px' }} />
                    Save Notebook
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section - Full Width */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', padding: '24px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px' }}>💡 Tips for Better Summaries</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '18px', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
            <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px' }}>📄 Supported Files</h4>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>PDF and TXT files up to 10MB</p>
          </div>
          <div style={{ padding: '18px', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
            <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px' }}>📏 Right Length</h4>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>Choose summary length based on your needs</p>
          </div>
          <div style={{ padding: '18px', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
            <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px' }}>🎯 Focus</h4>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>Summarize one topic at a time for best results</p>
          </div>
        </div>
      </div>
    </div>
  );
}
