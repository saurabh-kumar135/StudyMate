import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Trophy, 
  TrendingUp, 
  Clock,
  Flame,
  Plus,
  Sparkles,
  Loader
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    weeklyTimeHours: '0',
    currentStreak: 0,
    quizzesCompleted: 0,
    materialsReviewed: 0
  });
  const [user, setUser] = useState(null);
  const [recentNotebooks, setRecentNotebooks] = useState([]);
  const [featuredNotebooks, setFeaturedNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user stats
        const statsResponse = await axios.get(`${API_URL}/api/user/stats`, { withCredentials: true });
        if (statsResponse.data.success) {
          setStats({
            weeklyTimeHours: statsResponse.data.stats.weeklyTimeHours || '0',
            currentStreak: statsResponse.data.stats.currentStreak || 0,
            quizzesCompleted: statsResponse.data.stats.quizzesCompleted || 0,
            materialsReviewed: statsResponse.data.stats.materialsReviewed || 0
          });
          setUser(statsResponse.data.user);
        }

        // Fetch recent notebooks
        const recentResponse = await axios.get(`${API_URL}/api/notebooks/recent`, { withCredentials: true });
        if (recentResponse.data.success) {
          setRecentNotebooks(recentResponse.data.notebooks);
        }

        // Fetch featured notebooks
        const featuredResponse = await axios.get(`${API_URL}/api/notebooks/featured`, { withCredentials: true });
        if (featuredResponse.data.success) {
          setFeaturedNotebooks(featuredResponse.data.notebooks);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Track time spent on the platform (every 5 minutes)
    const trackTimeInterval = setInterval(async () => {
      try {
        await axios.post(`${API_URL}/api/user/track-time`, { minutes: 5 }, { withCredentials: true });
      } catch (error) {
        console.error('Error tracking time:', error);
      }
    }, 5 * 60 * 1000);

    // Track initial activity
    const trackInitialActivity = async () => {
      try {
        await axios.post(`${API_URL}/api/user/track-time`, { minutes: 1 }, { withCredentials: true });
      } catch (error) {
        console.error('Error tracking initial activity:', error);
      }
    };
    trackInitialActivity();

    return () => clearInterval(trackTimeInterval);
  }, []);

  const statCardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid var(--border-color)',
    boxShadow: `0 4px 6px var(--shadow)`,
    transition: 'all 0.3s'
  };

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid var(--border-color)'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader style={{ width: '48px', height: '48px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', padding: '32px 24px', paddingTop: '96px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Here's your study progress</p>
      </div>

      {/* Stats Grid - 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '28px', height: '28px', color: '#f97316' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontSize: '16px', fontWeight: '500' }}>
              <TrendingUp style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.weeklyTimeHours} hrs</h3>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>This week</p>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame style={{ width: '28px', height: '28px', color: '#f97316' }} />
            </div>
            <span style={{ fontSize: '32px' }}>🔥</span>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.currentStreak} days</h3>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Current streak</p>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy style={{ width: '28px', height: '28px', color: '#3b82f6' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.quizzesCompleted}</h3>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Quizzes completed</p>
        </div>

        <div style={cardStyle}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: '28px', height: '28px', color: '#22c55e' }} />
            </div>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.materialsReviewed}</h3>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Materials reviewed</p>
        </div>
      </div>

      {/* Featured Notebooks */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Featured notebooks</h2>
          <button style={{ color: 'var(--text-secondary)', fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>See all →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {featuredNotebooks.length > 0 ? (
            featuredNotebooks.slice(0, 3).map((notebook) => (
              <Link key={notebook._id} to={`/app/notebook/${notebook._id}`} style={{ ...cardStyle, textDecoration: 'none', display: 'block' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <FileText style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>{notebook.title}</h3>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>{formatRelativeTime(notebook.createdAt)} • {notebook.category || 'General'}</p>
              </Link>
            ))
          ) : (
            <>
              <Link to="/app/materials" style={{ ...cardStyle, textDecoration: 'none', display: 'block', opacity: 0.6 }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <FileText style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>No featured notebooks</h3>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Summarize materials to create notebooks</p>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Notebooks */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px' }}>Recent notebooks</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <Link to="/app/materials" style={{ ...cardStyle, border: '2px dashed #444', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <div style={{ width: '72px', height: '72px', backgroundColor: 'var(--bg-card)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Plus style={{ width: '36px', height: '36px', color: 'var(--text-secondary)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Create new notebook</p>
          </Link>
          {recentNotebooks.length > 0 ? (
            recentNotebooks.slice(0, 3).map((notebook) => (
              <Link key={notebook._id} to={`/app/notebook/${notebook._id}`} style={{ ...cardStyle, minHeight: '200px', display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
                <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <FileText style={{ width: '28px', height: '28px', color: '#f97316' }} />
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '20px', marginBottom: '10px' }}>{notebook.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: 'auto' }}>{formatRelativeTime(notebook.createdAt)}</p>
              </Link>
            ))
          ) : (
            <div style={{ ...cardStyle, minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
              <FileText style={{ width: '48px', height: '48px', color: '#6b7280', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', textAlign: 'center' }}>No notebooks yet.<br />Summarize some materials!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '20px' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <Link to="/app/ai-tutor" style={{ ...cardStyle, textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(to bottom right, #f97316, #ef4444)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }} />
              </div>
              <Sparkles style={{ width: '24px', height: '24px', color: '#f97316' }} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>AI Tutor</h3>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Ask questions and get instant help</p>
          </Link>

          <Link to="/app/quiz" style={{ ...cardStyle, textDecoration: 'none' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>Take Quiz</h3>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Test your knowledge</p>
          </Link>

          <Link to="/app/materials" style={{ ...cardStyle, textDecoration: 'none' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(to bottom right, #22c55e, #10b981)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '10px' }}>Study Materials</h3>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Upload and summarize notes</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
