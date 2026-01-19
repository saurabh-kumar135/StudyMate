import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, UserPlus, Chrome } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'guest',
    agreedToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password
      }, { withCredentials: true });

      if (response.data.success) {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
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
        maxWidth: '480px',
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
          Create Your Account
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
          {/* First Name and Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                First Name
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#3b82f6' }} />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
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
            <div>
              <label style={{ display: 'block', fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Last Name
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#3b82f6' }} />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
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
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#3b82f6' }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
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

          {/* Confirm Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#3b82f6' }} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '17px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* User Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
              I want to register as:
            </label>
            <div style={{ display: 'flex', gap: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="userType"
                  value="guest"
                  checked={formData.userType === 'guest'}
                  onChange={handleChange}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Guest</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="userType"
                  value="host"
                  checked={formData.userType === 'host'}
                  onChange={handleChange}
                  style={{ marginRight: '8px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Host</span>
              </label>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                style={{ marginRight: '8px', accentColor: '#3b82f6' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                I agree to the <Link to="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>terms and conditions</Link>
              </span>
            </label>
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

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--bg-card)' : '#3b82f6',
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
            <UserPlus style={{ width: '20px', height: '20px' }} />
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Login Link */}
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '15px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
