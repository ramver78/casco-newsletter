import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user, mfaSetupRequired } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (mfaSetupRequired) {
      navigate('/mfa-setup');
      return;
    }
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'editor') {
        navigate('/editor');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, mfaSetupRequired, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, showMfa ? mfaCode : undefined);
      
      if (result === 'mfa_required') {
        setShowMfa(true);
        setIsLoading(false);
        return;
      }
      
      if (result === 'mfa_setup_required') {
        return;
      }
      
      if (result === true) {
        // Navigation handled by useEffect
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowMfa(false);
    setMfaCode('');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="login-icon">{showMfa ? '🔐' : '✏️'}</span>
          <h1>{showMfa ? 'Two-Factor Authentication' : 'Login'}</h1>
          <p>{showMfa ? 'Enter the code from your authenticator app' : 'Sign in to your account'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {!showMfa ? (
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@cascoauto.com"
                required
                autoComplete="email"
              />
              <p className="input-hint">Enter your Casco email to receive MFA prompt</p>
            </div>
          ) : (
            <div className="form-group mfa-input">
              <label htmlFor="mfaCode">
                <Shield size={18} />
                Verification Code
              </label>
              <input
                type="text"
                id="mfaCode"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                required
                pattern="\d{6}"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="mfa-hint">Open your authenticator app to view your code</p>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading || (showMfa && mfaCode.length !== 6)}>
            {isLoading ? (
              <span className="loading-spinner-small" />
            ) : (
              <>
                <LogIn size={18} />
                {showMfa ? 'Verify' : 'Sign In'}
              </>
            )}
          </button>

          {showMfa && (
            <button type="button" className="back-btn" onClick={handleBackToLogin}>
              <ArrowLeft size={18} />
              Back to Login
            </button>
          )}
        </form>

        <div className="login-footer">
          <p className="domain-notice">
            📧 Only <strong>@cascoauto.com</strong> email addresses can register.
          </p>
          <p className="register-link">
            Don't have an account? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
