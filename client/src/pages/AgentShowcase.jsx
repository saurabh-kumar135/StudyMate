import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/api';
import { GraduationCap, Sun, Moon, Copy, Check, RefreshCw } from 'lucide-react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-secondary)' }} title="Copy">
      {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
    </button>
  );
}

export default function AgentShowcase() {
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/agent/latest`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setData(null);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const jsonStr = data ? JSON.stringify(data.payload, null, 2) : '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <GraduationCap size={32} color="var(--text-primary)" />
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>StudyMate</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={toggleTheme} style={{ padding: '8px', backgroundColor: 'transparent', border: '2px solid var(--border-color)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}>
              {theme === 'light' ? <Moon size={18} color="var(--text-primary)" /> : <Sun size={18} color="var(--text-primary)" />}
            </button>
            <Link to="/" style={{ padding: '8px 20px', border: '2px solid var(--text-primary)', borderRadius: '9999px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px 80px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            🤖 AI Agent{' '}
            <span style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Response
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            JSON data received from the Groq API via <code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>test_api.sh</code>
          </p>
        </div>

        {/* Refresh button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', border: '2px solid var(--border-color)', borderRadius: '10px', background: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : error ? (
          <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px', color: '#ef4444' }}>❌ {error}</div>
        ) : !data ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '24px' }}>No data received yet.</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Run this command to send data:</p>
            <div style={{ background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-color)', padding: '16px', marginTop: '12px', textAlign: 'left' }}>
              <pre style={{ margin: 0, fontSize: '13px', color: '#22c55e', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`bash test_api.sh | curl -X POST http://localhost:3009/api/agent/receive \\
  -H "Content-Type: application/json" -d @-`}
              </pre>
            </div>
          </div>
        ) : (
          <div>
            {/* Received timestamp */}
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              📩 Received at: <strong>{new Date(data.received_at).toLocaleString()}</strong>
            </div>

            {/* JSON display */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Groq API Response</span>
                <CopyButton text={jsonStr} />
              </div>
              <pre style={{ margin: 0, padding: '20px', fontSize: '13px', lineHeight: 1.7, overflowX: 'auto', color: 'var(--text-primary)', fontFamily: "'Fira Code', 'Cascadia Code', monospace", maxHeight: '70vh', overflowY: 'auto' }}>
                {jsonStr}
              </pre>
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '32px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <p style={{ margin: 0 }}>© 2026 StudyMate. AI Agent Pipeline.</p>
        </div>
      </footer>
    </div>
  );
}
