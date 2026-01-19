import { Link } from 'react-router-dom';
import { GraduationCap, Upload, Sparkles, FileText, Brain } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#0a0a0a', borderBottom: '1px solid #333', zIndex: 50 }}>
        <div style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GraduationCap style={{ width: '40px', height: '40px', color: 'white' }} />
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>StudyMate</span>
          </div>
          <div>
            <Link to="/signup" style={{ padding: '12px 32px', backgroundColor: 'transparent', color: 'white', border: '2px solid white', borderRadius: '9999px', fontSize: '18px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', padding: '96px 0' }}>
          <h1 style={{ fontSize: '72px', fontWeight: 'bold', marginBottom: '32px', lineHeight: '1.1' }}>
            <span style={{ color: 'white' }}>STUDY SMART </span>
            <span style={{ background: 'linear-gradient(to right, #3b82f6, #06b6d4, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WITH AI
            </span>
          </h1>
          
          <p style={{ color: '#9ca3af', fontSize: '22px', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            Your research and thinking partner, grounded in the information you trust, built with the latest Gemini models.
          </p>

          <Link
            to="/signup"
            style={{ display: 'inline-block', padding: '18px 48px', background: 'linear-gradient(to right, #3b82f6, #06b6d4)', color: 'white', borderRadius: '9999px', fontSize: '20px', fontWeight: '500', textDecoration: 'none' }}
          >
            Try StudyMate
          </Link>
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 0' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'center', marginBottom: '64px', color: 'white' }}>Your AI-Powered Study Partner</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Feature 1 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#1a1a1a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #333' }}>
                <Upload style={{ width: '40px', height: '40px', color: '#9ca3af' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>Upload your sources</h3>
              <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6' }}>
                Upload PDFs, websites, YouTube videos, audio files, Google Docs.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#1a1a1a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #333' }}>
                <Sparkles style={{ width: '40px', height: '40px', color: '#9ca3af' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>AI-powered insights</h3>
              <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6' }}>
                Get summaries, explanations, and generate quizzes from your materials.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#1a1a1a', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid #333' }}>
                <Brain style={{ width: '40px', height: '40px', color: '#9ca3af' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>Chat with AI tutor</h3>
              <p style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6' }}>
                Ask questions and get instant, detailed explanations on any topic.
              </p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100%', maxWidth: '900px', background: 'linear-gradient(to bottom right, #1a1a1a, #0a0a0a)', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid #333' }}>
              <div style={{ backgroundColor: '#2a2a2a', borderRadius: '16px', padding: '32px', border: '1px solid #444' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '50%' }}></div>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ height: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', width: '75%' }}></div>
                  <div style={{ height: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', width: '50%' }}></div>
                  <div style={{ height: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', width: '85%' }}></div>
                  <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <FileText style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                      <span style={{ fontSize: '16px', color: '#d1d5db' }}>Study Material</span>
                    </div>
                    <div style={{ height: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', width: '100%', marginBottom: '12px' }}></div>
                    <div style={{ height: '16px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ padding: '96px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '32px', color: 'white' }}>Ready to study smarter?</h2>
          <p style={{ color: '#9ca3af', fontSize: '22px', marginBottom: '40px', lineHeight: '1.6' }}>
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

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #333', padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
          <p style={{ margin: 0 }}>© 2026 StudyMate. Powered by Google Gemini AI.</p>
        </div>
      </footer>
    </div>
  );
}
