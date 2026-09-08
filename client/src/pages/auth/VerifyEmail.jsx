import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, KeyRound, Clock, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/api';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  useEffect(() => {
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
  }, [timeLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; 

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
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
      handleVerify(digits.join(''));
    }
  };

  const handleVerify = async (otpCode) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/verify-email/verify-otp`,
        { email, otp: code },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccessMsg('Email verified successfully! Redirecting...');
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

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/verify-email/resend-otp`,
        { email },
        { withCredentials: true }
      );

      if (response.data.success) {
        setTimeLeft(600);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccessMsg('New verification code sent to your email!');
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || 
                        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) || 
                        'Failed to resend code. Please try again.';
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
        maxWidth: '460px',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid #3b82f6',
        borderRadius: '16px',
        padding: '36px 30px',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.12)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15))',
            color: '#3b82f6',
            marginBottom: '14px'
          }}>
            <KeyRound style={{ width: '28px', height: '28px' }} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
            Verify Your Email
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            We've sent a 6-digit verification code to
          </p>
          <p style={{ color: '#3b82f6', fontWeight: '600', fontSize: '15px', marginTop: '2px' }}>
            {email}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#dc2626',
            padding: '12px 14px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
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
            gap: '8px'
          }}>
            <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', textAlign: 'center' }}>
            Enter 6-Digit Code
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }} onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-card)',
                  border: digit ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: digit ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              />
            ))}
          </div>
        </div>

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
            <strong>Code expired! Request a new code.</strong>
          )}
        </div>

        <button
          onClick={() => handleVerify()}
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
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              Verify Email
            </>
          )}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '14px' }}>
          <Link to="/signup" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Signup
          </Link>

          <button
            onClick={handleResend}
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
    </div>
  );
};

export default VerifyEmail;
