import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      }, { withCredentials: true });

      if (response.data.success) {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-primary)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid #3b82f6',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#3b82f6', 
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          Log in
        </h1>

        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '1px solid #ef4444', 
            color: '#dc2626', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#3b82f6' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="abcdef@gmail.com"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#3b82f6' }} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            <Chrome style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
            Continue with Google
          </button>

          {/* OR Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 12px', color: 'var(--text-secondary)', fontSize: '15px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--bg-card)' : 'linear-gradient(to right, #3b82f6, #06b6d4)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <LogIn style={{ width: '20px', height: '20px' }} />
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        {/* Signup Link */}
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
            Sign up
          </Link>
        </p>

        {/* Terms */}
        <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          By continuing, you agree to StudyMate's{' '}
          <Link to="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" style={{ color: '#3b82f6', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
