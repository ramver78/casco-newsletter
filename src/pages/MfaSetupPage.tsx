import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import './MfaSetupPage.css';

const MfaSetupPage: React.FC = () => {
  const { mfaSetupRequired, completeMfaSetup, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mfaData, setMfaData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'scan' | 'verify'>('loading');

  useEffect(() => {
    if (!mfaSetupRequired) {
      navigate('/');
      return;
    }
    
    setupMfa();
  }, [mfaSetupRequired, navigate]);

  const setupMfa = async () => {
    try {
      setStep('loading');
      const data = await authApi.setupMfa();
      setMfaData(data);
      setStep('scan');
    } catch (err: any) {
      setError(err.message || 'Failed to setup MFA. Please try logging in again.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await completeMfaSetup(verifyCode);
      if (success) {
        // Redirect based on role
        if (user?.role === 'admin' || user?.role === 'editor') {
          navigate('/editor');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
    navigate('/login');
  };

  if (!mfaSetupRequired) {
    return null;
  }

  return (
    <div className="mfa-setup-page">
      <div className="mfa-setup-container">
        <div className="mfa-setup-header">
          <div className="shield-icon">
            <Shield size={48} />
          </div>
          <h1>Set Up Two-Factor Authentication</h1>
          <p>MFA is required for all accounts. This adds an extra layer of security.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 'loading' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating your secure key...</p>
          </div>
        )}

        {step === 'scan' && mfaData && (
          <div className="mfa-setup-content">
            <div className="setup-instructions">
              <h2>Step 1: Scan QR Code</h2>
              <p>Use an authenticator app to scan this QR code:</p>
              <ul>
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
              </ul>
            </div>

            <div className="qr-section">
              <img src={mfaData.qrCode} alt="MFA QR Code" className="qr-code" />
              <div className="secret-key">
                <span className="label">Or enter this code manually:</span>
                <code>{mfaData.secret}</code>
              </div>
            </div>

            <button className="next-btn" onClick={() => setStep('verify')}>
              <CheckCircle size={18} />
              I've scanned the code
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="mfa-verify-content">
            <div className="setup-instructions">
              <h2>Step 2: Verify Setup</h2>
              <p>Enter the 6-digit code from your authenticator app:</p>
            </div>

            <form onSubmit={handleVerify} className="verify-form">
              <div className="code-input-group">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="back-btn" 
                  onClick={() => setStep('scan')}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="verify-btn" 
                  disabled={isLoading || verifyCode.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Complete Setup'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mfa-setup-footer">
          <button className="cancel-link" onClick={handleCancel}>
            Cancel and logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MfaSetupPage;
