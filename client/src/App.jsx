import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AITutor from './pages/AITutor';
import StudyMaterials from './pages/StudyMaterials';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import NotebookView from './pages/NotebookView';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import Home from './pages/Home';
import AgentShowcase from './pages/AgentShowcase';
import RetentionAnalytics from './pages/RetentionAnalytics';
import StudyRoom from './pages/StudyRoom';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing Page (No Navbar) */}
          <Route path="/" element={<Home />} />
          <Route path="/ai-showcase" element={<AgentShowcase />} />
          
          {/* Auth Routes (No Navbar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Direct Route Aliases to /app/* */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/retention" element={<Navigate to="/app/retention" replace />} />
          <Route path="/ai-tutor" element={<Navigate to="/app/ai-tutor" replace />} />
          <Route path="/materials" element={<Navigate to="/app/materials" replace />} />
          <Route path="/quiz" element={<Navigate to="/app/quiz" replace />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/search" element={<Navigate to="/app/search" replace />} />
          <Route path="/notebook/:id" element={<Navigate to="/app/notebook/:id" replace />} />
          <Route path="/study-room" element={<StudyRoom />} />
          <Route path="/study-room/:roomId" element={<StudyRoom />} />

          {/* App Routes (With Navbar) */}
          <Route path="/app/*" element={
            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/retention" element={<RetentionAnalytics />} />
                <Route path="/ai-tutor" element={<AITutor />} />
                <Route path="/materials" element={<StudyMaterials />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notebook/:id" element={<NotebookView />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
            </div>
          } />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
