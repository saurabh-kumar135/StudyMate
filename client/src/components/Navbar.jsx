import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, LogOut, Menu, X, Settings, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/ai-tutor', label: 'AI tutor' },
    { to: '/app/materials', label: 'Materials' },
    { to: '/app/quiz', label: 'Quizzes' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/check-session`, { withCredentials: true });
        if (response.data.success && response.data.isLoggedIn) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Get user initial (first letter of first name)
  const getUserInitial = () => {
    if (user && user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav style={{ 
      backgroundColor: 'var(--bg-card)', 
      borderBottom: '1px solid var(--border-color)', 
      position: 'fixed', 
      top: 0, 
      left: 0,
      right: 0,
      zIndex: 50, 
      width: '100%',
      height: '72px'
    }}>
      {/* LEFT - StudyMate at absolute top left corner */}
      <Link 
        to="/app/dashboard" 
        style={{ 
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          textDecoration: 'none'
        }}
      >
        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(to bottom right, #f97316, #ef4444)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap style={{ width: '28px', height: '28px', color: 'var(--text-primary)' }} />
        </div>
        <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>StudyMate</span>
      </Link>

      {/* CENTER - Search + Nav with space-evenly */}
      <div style={{ 
        position: 'absolute',
        top: '50%',
        left: '250px',
        right: '180px',
        transform: 'translateY(-50%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-evenly'
      }}>
        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ position: 'relative', width: '280px' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search notebooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '48px', paddingRight: '20px', paddingTop: '10px', paddingBottom: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid #333', borderRadius: '10px', fontSize: '16px', color: 'var(--text-primary)', outline: 'none' }}
          />
        </form>
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} style={{ color: '#d1d5db', fontSize: '18px', textDecoration: 'none', fontWeight: '500' }}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* RIGHT - Icons at absolute top right corner */}
      <div style={{ 
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px'
      }}>
        <button style={{ padding: '12px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
          <Settings style={{ width: '28px', height: '28px' }} />
        </button>
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          style={{ padding: '12px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s' }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon style={{ width: '28px', height: '28px' }} />
          ) : (
            <Sun style={{ width: '28px', height: '28px' }} />
          )}
        </button>
        {/* User Initial Avatar */}
        <div 
          style={{ 
            width: '48px', 
            height: '48px', 
            background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px solid #444'
          }}
          title={user ? `${user.firstName} ${user.lastName || ''}` : 'User'}
        >
          <span style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 'bold' }}>{getUserInitial()}</span>
        </div>
        <button onClick={handleLogout} style={{ padding: '12px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer' }} title="Logout">
          <LogOut style={{ width: '28px', height: '28px' }} />
        </button>
      </div>
    </nav>
  );
}
