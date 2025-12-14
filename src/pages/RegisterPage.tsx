import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated, mfaSetupRequired } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (mfaSetupRequired) {
      navigate('/mfa-setup');
      return;
    }
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, mfaSetupRequired, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email domain
    if (!email.toLowerCase().endsWith('@cascoauto.com')) {
      setError('Registration is only available for @cascoauto.com email addresses.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(email, name);
      if (result === 'mfa_setup_required' || result === true) {
        // Navigation handled by useEffect
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="login-icon">📝</span>
          <h1>Create Account</h1>
          <p>Register with your Casco Auto email</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">
              <User size={18} />
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              autoComplete="name"
            />
          </div>

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
            <span className="input-hint">Must be a @cascoauto.com email</span>
          </div>

          <div className="mfa-notice">
            <p>🔐 After registration, you'll set up MFA using an authenticator app (Google Authenticator, Microsoft Authenticator, etc.)</p>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner-small" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="register-link">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
