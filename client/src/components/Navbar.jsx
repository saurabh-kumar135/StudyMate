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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/retention', label: 'Retention AI' },
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <>
      <nav style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderBottom: '1px solid var(--border-color)', 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 50, 
        width: '100%',
        height: isMobile ? '64px' : '72px',
        padding: isMobile ? '8px 12px' : '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* LEFT - Logo/Brand */}
        <Link 
          to="/app/dashboard" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '8px' : '12px', 
            textDecoration: 'none',
            zIndex: 51
          }}
        >
          <div style={{ 
            width: isMobile ? '36px' : '48px', 
            height: isMobile ? '36px' : '48px', 
            background: 'linear-gradient(to bottom right, #f97316, #ef4444)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <GraduationCap style={{ width: isMobile ? '20px' : '28px', height: isMobile ? '20px' : '28px', color: 'white' }} />
          </div>
          {!isMobile && <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>StudyMate</span>}
        </Link>

        {/* DESKTOP - Center Navigation */}
        {!isMobile && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '32px',
            flex: 1,
            justifyContent: 'center',
            maxWidth: '800px'
          }}>
            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ position: 'relative', width: '280px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  paddingLeft: '48px', 
                  paddingRight: '20px', 
                  paddingTop: '10px', 
                  paddingBottom: '10px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  fontSize: '16px', 
                  color: 'var(--text-primary)', 
                  outline: 'none' 
                }}
              />
            </form>
            
            {/* Nav Links */}
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '16px', 
                  textDecoration: 'none', 
                  fontWeight: '500',
                  transition: 'color 0.2s'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* RIGHT - User Actions */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '4px' : '8px'
        }}>
          {!isMobile && (
            <button style={{ padding: '12px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
              <Settings style={{ width: '24px', height: '24px' }} />
            </button>
          )}
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            style={{ 
              padding: isMobile ? '8px' : '12px', 
              color: 'var(--text-secondary)', 
              backgroundColor: 'transparent', 
              border: 'none', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }} />
            ) : (
              <Sun style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }} />
            )}
          </button>
          
          {/* User Avatar */}
          {!isMobile && (
            <div 
              style={{ 
                width: '40px', 
                height: '40px', 
                background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                border: '2px solid var(--border-color)'
              }}
              title={user ? `${user.firstName} ${user.lastName || ''}` : 'User'}
            >
              <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{getUserInitial()}</span>
            </div>
          )}
          
          {!isMobile && (
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '12px', 
                color: 'var(--text-secondary)', 
                backgroundColor: 'transparent', 
                border: 'none', 
                borderRadius: '10px', 
                cursor: 'pointer' 
              }} 
              title="Logout"
            >
              <LogOut style={{ width: '24px', height: '24px' }} />
            </button>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              style={{ 
                padding: '8px', 
                color: 'var(--text-primary)', 
                backgroundColor: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 51
              }}
            >
              {isOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: '64px', 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'var(--bg-card)', 
            zIndex: 40,
            padding: '20px',
            overflowY: 'auto',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          {/* Search Bar Mobile */}
          <form onSubmit={(e) => { handleSearch(e); setIsOpen(false); }} style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Search notebooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  paddingLeft: '48px', 
                  paddingRight: '20px', 
                  paddingTop: '12px', 
                  paddingBottom: '12px', 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  fontSize: '16px', 
                  color: 'var(--text-primary)', 
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </form>

          {/* Nav Links Mobile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to}
                onClick={() => setIsOpen(false)}
                style={{ 
                  color: 'var(--text-primary)', 
                  fontSize: '18px', 
                  textDecoration: 'none', 
                  fontWeight: '500',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  display: 'block'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Info Mobile */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: '8px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid var(--border-color)'
              }}
            >
              <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{getUserInitial()}</span>
            </div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '16px' }}>
                {user ? `${user.firstName} ${user.lastName || ''}` : 'User'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {user?.email || ''}
              </div>
            </div>
          </div>

          {/* Logout Button Mobile */}
          <button 
            onClick={() => { handleLogout(); setIsOpen(false); }}
            style={{ 
              width: '100%',
              padding: '16px', 
              color: '#ef4444', 
              backgroundColor: 'var(--bg-secondary)', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <LogOut style={{ width: '20px', height: '20px' }} />
            Logout
          </button>
        </div>
      )}
    </>
  );
}
