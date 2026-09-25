import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Users, Layers, Sun, Moon, CheckCircle2, ArrowRight, PenTool, Clock, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? (window.innerWidth > 640 && window.innerWidth <= 1024) : false);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
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
              title={'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'}
            >
              {theme === 'light' ? (
                <Moon style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
              ) : (
                <Sun style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
              )}
            </button>
            <Link to="/login" style={{ padding: isMobile ? '8px 14px' : '12px 24px', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '9999px', fontSize: isMobile ? '13px' : '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
              Log In
            </Link>
            <Link to="/signup" style={{ padding: isMobile ? '8px 18px' : '12px 28px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: isMobile ? '13px' : '16px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', boxShadow: '0 2px 8px rgba(6, 182, 212, 0.25)' }}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px', paddingTop: isMobile ? '64px' : '80px' }}>
        <div style={{ textAlign: 'center', padding: isMobile ? '48px 0' : (isTablet ? '72px 0' : '96px 0') }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
            Collaborative Student Workspace
          </div>

          <h1 style={{ fontSize: isMobile ? '36px' : (isTablet ? '56px' : '68px'), fontWeight: '800', marginBottom: isMobile ? '20px' : '28px', lineHeight: '1.15', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--text-primary)' }}>STUDY SMARTER. </span>
            <span style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MASTER ANY SUBJECT.
            </span>
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '16px' : (isTablet ? '18px' : '21px'), marginBottom: isMobile ? '28px' : '40px', maxWidth: '740px', margin: isMobile ? '0 auto 24px' : '0 auto 40px', lineHeight: '1.6' }}>
            An all-in-one workspace designed for focused learning. Organize study materials, master concepts with active recall flashcards, and collaborate live in virtual study rooms.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 40px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: '18px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)' }}
            >
              Get Started Free <ArrowRight style={{ width: '20px', height: '20px' }} />
            </Link>
            <Link
              to="/study-room"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 36px', border: '2px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '9999px', fontSize: '18px', fontWeight: '600', textDecoration: 'none', backgroundColor: 'var(--bg-card)' }}
            >
              <Users style={{ width: '20px', height: '20px', color: '#06b6d4' }} /> Explore Study Rooms
            </Link>
          </div>
        </div>

        <div style={{ padding: isMobile ? '40px 0' : (isTablet ? '60px 0' : '80px 0') }}>
          <h2 style={{ fontSize: isMobile ? '28px' : (isTablet ? '34px' : '40px'), fontWeight: 'bold', textAlign: 'center', marginBottom: isMobile ? '32px' : (isTablet ? '48px' : '56px'), color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Everything You Need To Excel
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'), gap: isMobile ? '24px' : '32px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ padding: '32px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px var(--shadow)' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <BookOpen style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>Organized Study Materials</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                Upload notes, textbooks, and syllabus PDFs. Extract structured outlines, key formula sheets, and chapter summaries.
              </p>
            </div>

            <div style={{ padding: '32px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px var(--shadow)' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Users style={{ width: '32px', height: '32px', color: '#06b6d4' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>Live Collaborative Rooms</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                Study with peers with real-time synchronized whiteboard canvas, video tiles, and cooperative problem-solving.
              </p>
            </div>

            <div style={{ padding: '32px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px var(--shadow)' }}>
              <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Layers style={{ width: '32px', height: '32px', color: '#22c55e' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>Active Recall & Quizzes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                Strengthen memory retention with interactive flashcard decks, spaced repetition intervals, and timed practice tests.
              </p>
            </div>
          </div>
        </div>

        {/* Live Workspace Preview */}
        <div style={{ padding: isMobile ? '20px 0' : '40px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '960px', background: 'var(--bg-secondary)', borderRadius: '24px', padding: isMobile ? '16px' : '32px', boxShadow: '0 20px 40px -10px var(--shadow)', border: '1px solid var(--border-color)' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: isMobile ? '20px' : '32px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '50%' }}></div>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: '500' }}>Active Study Workspace</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#22c55e', fontWeight: '600' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                  Session In Progress
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <BookOpen style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>Cell Biology & Genetics • Chapter 4</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    Mitochondria produce ATP via oxidative phosphorylation across the inner membrane electron transport chain. Key enzymes include ATP synthase complex V.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', color: 'var(--text-secondary)' }}>12 Flashcards</span>
                    <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', color: 'var(--text-secondary)' }}>8 Quiz Questions</span>
                  </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <PenTool style={{ width: '18px', height: '18px', color: '#06b6d4' }} />
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px' }}>Collaborative Whiteboard</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      Live synced canvas with peers. Real-time drawing, diagrams, and note markup.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', marginLeft: '6px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>SK</span>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#06b6d4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', marginLeft: '-6px' }}>AL</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>2 students collaborating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '48px 0' : (isTablet ? '72px 0' : '96px 0'), textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? '32px' : (isTablet ? '38px' : '44px'), fontWeight: 'bold', marginBottom: isMobile ? '16px' : '24px', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Ready to elevate your study routine?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '16px' : (isTablet ? '18px' : '20px'), marginBottom: isMobile ? '24px' : '36px', lineHeight: '1.6' }}>
            Join students using StudyMate for organized notes, active recall, and collaborative study sessions.
          </p>
          <Link
            to="/signup"
            style={{ display: 'inline-block', padding: '18px 48px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: '18px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)' }}
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '32px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '15px' }}>
          <p style={{ margin: 0 }}>© 2026 StudyMate. Designed for students, thinkers, and lifelong learners.</p>
        </div>
      </footer>
    </div>
  );
}
