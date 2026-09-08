import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, UserPlus, Chrome, KeyRound, ArrowLeft, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'guest',
    agreedToTerms: false
  });
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false);

  const inputRefs = useRef([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (step !== 'otp') return;

    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Focus the first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  // Step 1: Submit Form to dispatch OTP
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.firstName.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
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
      const response = await axios.post(`${API_URL}/api/verify-email/send-otp`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        userType: formData.userType
      }, { withCredentials: true });

      if (response.data.success) {
        setStep('otp');
        setTimeLeft(600);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccessMessage(response.data.message || `Verification code sent to ${formData.email}!`);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || 
                        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) || 
                        err.response?.data?.message || 
                        'Failed to send verification code. Please check your details and try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take the last digit typed
    setOtp(newOtp);
    setError('');

    // Advance to next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    if (newOtp.every(d => d !== '') && index === 5) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (digits.length === 6) {
      handleVerifyOtp(digits.join(''));
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/verify-email/verify-otp`, {
        email: formData.email.trim(),
        otp: code
      }, { withCredentials: true });

      if (response.data.success) {
        setSuccessMessage('Account verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 1200);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || 
                        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) || 
                        err.response?.data?.message || 
                        'Invalid verification code. Please check and try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resending || (!canResend && timeLeft > 540)) return;

    setResending(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/verify-email/resend-otp`, {
        email: formData.email.trim()
      }, { withCredentials: true });

      if (response.data.success) {
        setTimeLeft(600);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccessMessage('A fresh verification code has been dispatched to your email!');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || 
                        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) || 
                        err.response?.data?.message || 
                        'Failed to resend code. Please wait a moment.';
      setError(serverMsg);
    } finally {
      setResending(false);
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
        maxWidth: '490px',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid #3b82f6',
        borderRadius: '16px',
        padding: isMobile ? '24px 18px' : '40px 32px',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.12)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15))',
            color: '#3b82f6',
            marginBottom: '12px'
          }}>
            {step === 'form' ? (
              <UserPlus style={{ width: '28px', height: '28px' }} />
            ) : (
              <KeyRound style={{ width: '28px', height: '28px' }} />
            )}
          </div>
          <h1 style={{ 
            fontSize: '26px', 
            fontWeight: 'bold', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {step === 'form' ? 'Create Your Account' : 'Verify Your Email'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            {step === 'form' 
              ? 'Join StudyMate to unlock AI tutoring & smart notes' 
              : `We sent a 6-digit code to ${formData.email}`}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            border: '1px solid #ef4444', 
            color: '#dc2626', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ 
            backgroundColor: '#ecfdf5', 
            border: '1px solid #10b981', 
            color: '#059669', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: 1.4
          }}>
            <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: REGISTRATION DETAILS */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm}>
            {/* First Name & Last Name */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: '16px', 
              marginBottom: '18px' 
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  First Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#3b82f6' }} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Last Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#3b82f6' }} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#3b82f6' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Password (min. 6 characters) *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#3b82f6' }} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#3b82f6' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 40px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: '#3b82f6' }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  I agree to the <Link to="/terms" style={{ color: '#3b82f6', textDecoration: 'none' }}>terms & conditions</Link>
                </span>
              </label>
            </div>

            {/* Send OTP / Register Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'var(--bg-card)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" style={{ width: '18px', height: '18px' }} />
                  Sending Verification Code...
                </>
              ) : (
                <>
                  <Mail style={{ width: '18px', height: '18px' }} />
                  Continue & Send Verification Code
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', textAlign: 'center' }}>
                Enter 6-Digit Code
              </label>
              
              {/* 6 OTP boxes */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: isMobile ? '8px' : '12px' 
                }} 
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    disabled={loading}
                    style={{
                      width: isMobile ? '42px' : '52px',
                      height: isMobile ? '50px' : '60px',
                      fontSize: isMobile ? '20px' : '24px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-card)',
                      border: digit ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border 0.2s',
                      boxShadow: digit ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Expiration timer */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              fontSize: '14px', 
              color: timeLeft > 0 ? 'var(--text-secondary)' : '#ef4444',
              marginBottom: '24px'
            }}>
              <Clock style={{ width: '16px', height: '16px' }} />
              {timeLeft > 0 ? (
                <span>Code expires in <strong style={{ color: '#3b82f6' }}>{formatTime(timeLeft)}</strong></span>
              ) : (
                <strong>Code expired! Please request a new code.</strong>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => !d)}
              style={{
                width: '100%',
                padding: '13px',
                background: (loading || otp.some((d) => !d))
                  ? 'var(--bg-card)' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (loading || otp.some((d) => !d)) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                marginBottom: '16px'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" style={{ width: '18px', height: '18px' }} />
                  Verifying Account...
                </>
              ) : (
                <>
                  <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                  Verify & Activate Account
                </>
              )}
            </button>

            {/* Resend and Change Email options */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                  setSuccessMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Edit details
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || (!canResend && timeLeft > 540)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: (resending || (!canResend && timeLeft > 540)) ? 'var(--text-secondary)' : '#3b82f6',
                  cursor: (resending || (!canResend && timeLeft > 540)) ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  padding: 0
                }}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* Login Link */}
        <p style={{ textAlign: 'center', marginTop: '26px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
