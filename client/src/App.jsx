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
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing Page (No Navbar) */}
          <Route path="/" element={<Home />} />
          
          {/* Auth Routes (No Navbar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* App Routes (With Navbar) */}
          <Route path="/app/*" element={
            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ai-tutor" element={<AITutor />} />
                <Route path="/materials" element={<StudyMaterials />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notebook/:id" element={<NotebookView />} />
                <Route path="/search" element={<SearchResults />} />
              </Routes>
            </div>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
