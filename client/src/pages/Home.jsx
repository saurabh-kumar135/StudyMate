import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GraduationCap, Upload, Sparkles, FileText, Brain, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 640 && window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
      setIsTablet(window.innerWidth > 640 && window.innerWidth <= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', zIndex: 50 }}>
        <div style={{ width: '100%', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            <GraduationCap style={{ width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', color: 'var(--text-primary)' }} />
            <span style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>StudyMate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={toggleTheme}
              style={{ 
                padding: '8px', 
                backgroundColor: 'transparent', 
                border: '2px solid var(--border-color)', 
                borderRadius: '50%', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px'
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
              ) : (
                <Sun style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
              )}
            </button>
            <Link to="/signup" style={{ padding: isMobile ? '8px 20px' : '12px 32px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '2px solid var(--text-primary)', borderRadius: '9999px', fontSize: isMobile ? '14px' : '18px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px', paddingTop: isMobile ? '64px' : '80px' }}>
        <div style={{ textAlign: 'center', padding: isMobile ? '48px 0' : (isTablet ? '72px 0' : '96px 0') }}>
          <h1 style={{ fontSize: isMobile ? '36px' : (isTablet ? '56px' : '72px'), fontWeight: 'bold', marginBottom: isMobile ? '20px' : '32px', lineHeight: '1.1' }}>
            <span style={{ color: 'var(--text-primary)' }}>STUDY SMART </span>
            <span style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WITH AI
            </span>
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '16px' : (isTablet ? '18px' : '22px'), marginBottom: isMobile ? '24px' : '40px', maxWidth: '700px', margin: isMobile ? '0 auto 24px' : '0 auto 40px', lineHeight: '1.6' }}>
            Your research and thinking partner, grounded in the information you trust, built with the latest Gemini models.
          </p>

          <Link
            to="/signup"
            style={{ display: 'inline-block', padding: '18px 48px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: '20px', fontWeight: '500', textDecoration: 'none' }}
          >
            Try StudyMate
          </Link>
        </div>

        <div style={{ padding: isMobile ? '40px 0' : (isTablet ? '60px 0' : '80px 0') }}>
          <h2 style={{ fontSize: isMobile ? '28px' : (isTablet ? '36px' : '42px'), fontWeight: 'bold', textAlign: 'center', marginBottom: isMobile ? '32px' : (isTablet ? '48px' : '64px'), color: 'var(--text-primary)' }}>Your AI-Powered Study Partner</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'), gap: isMobile ? '32px' : '48px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border-color)' }}>
                <Upload style={{ width: '40px', height: '40px', color: 'var(--text-secondary)' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Upload your sources</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6' }}>
                Upload PDFs, websites, YouTube videos, audio files, Google Docs.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border-color)' }}>
                <Sparkles style={{ width: '40px', height: '40px', color: 'var(--text-secondary)' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>AI-powered insights</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6' }}>
                Get summaries, explanations, and generate quizzes from your materials.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--border-color)' }}>
                <Brain style={{ width: '40px', height: '40px', color: 'var(--text-secondary)' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Chat with AI tutor</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6' }}>
                Ask questions and get instant, detailed explanations on any topic.
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '40px 0' : (isTablet ? '60px 0' : '80px 0'), display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100%', maxWidth: '900px', background: 'var(--bg-secondary)', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px var(--shadow)', border: '1px solid var(--border-color)' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '50%' }}></div>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ height: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', width: '75%' }}></div>
                  <div style={{ height: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', width: '50%' }}></div>
                  <div style={{ height: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', width: '85%' }}></div>
                  <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <FileText style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                      <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Study Material</span>
                    </div>
                    <div style={{ height: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', width: '100%', marginBottom: '12px' }}></div>
                    <div style={{ height: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '48px 0' : (isTablet ? '72px 0' : '96px 0'), textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? '32px' : (isTablet ? '40px' : '48px'), fontWeight: 'bold', marginBottom: isMobile ? '20px' : '32px', color: 'var(--text-primary)' }}>Ready to study smarter?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '16px' : (isTablet ? '18px' : '22px'), marginBottom: isMobile ? '24px' : '40px', lineHeight: '1.6' }}>
            Join thousands of students using AI to accelerate their learning
          </p>
          <Link
            to="/signup"
            style={{ display: 'inline-block', padding: '18px 48px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: '20px', fontWeight: '500', textDecoration: 'none' }}
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '16px' }}>
          <p style={{ margin: 0 }}>© 2026 StudyMate. Powered by Google Gemini AI.</p>
        </div>
      </footer>
    </div>
  );
}
