import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, ShieldCheck, ShieldOff, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrCode: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSetupMfa = async () => {
    setError('');
    setIsLoading(true);
    try {
      const data = await authApi.setupMfa();
      setMfaSetup(data);
    } catch (err: any) {
      setError(err.message || 'Failed to setup MFA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.verifyMfa(verifyCode);
      setMfaEnabled(true);
      setMfaSetup(null);
      setVerifyCode('');
      setSuccess('MFA enabled successfully! You will need to enter a code when logging in.');
      // Update stored user
      const storedUser = authApi.getStoredUser();
      if (storedUser) {
        storedUser.mfaEnabled = true;
        localStorage.setItem('casco_user', JSON.stringify(storedUser));
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.disableMfa(disablePassword);
      setMfaEnabled(false);
      setDisablePassword('');
      setSuccess('MFA disabled successfully.');
      // Update stored user
      const storedUser = authApi.getStoredUser();
      if (storedUser) {
        storedUser.mfaEnabled = false;
        localStorage.setItem('casco_user', JSON.stringify(storedUser));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1><Settings size={28} /> Account Settings</h1>
        <p>Manage your account security and preferences</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-section">
        <div className="section-header">
          <Shield size={24} />
          <div>
            <h2>Two-Factor Authentication (MFA)</h2>
            <p>Add an extra layer of security to your account</p>
          </div>
        </div>

        <div className="mfa-status">
          <div className={`status-indicator ${mfaEnabled ? 'enabled' : 'disabled'}`}>
            {mfaEnabled ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
            <span>{mfaEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        {!mfaEnabled && !mfaSetup && (
          <div className="mfa-action">
            <p className="mfa-description">
              Protect your account by requiring a verification code from your authenticator app 
              (like Google Authenticator, Authy, or Microsoft Authenticator) when signing in.
            </p>
            <button className="enable-mfa-btn" onClick={handleSetupMfa} disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Enable MFA'}
            </button>
          </div>
        )}

        {mfaSetup && (
          <div className="mfa-setup">
            <div className="setup-steps">
              <h3>Set up your authenticator app</h3>
              <ol>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code below or enter the secret key manually</li>
                <li>Enter the 6-digit verification code from your app</li>
              </ol>
            </div>

            <div className="qr-section">
              <img src={mfaSetup.qrCode} alt="MFA QR Code" className="qr-code" />
              <div className="secret-key">
                <span className="label">Secret key (manual entry):</span>
                <code>{mfaSetup.secret}</code>
              </div>
            </div>

            <form onSubmit={handleVerifyMfa} className="verify-form">
              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  pattern="\d{6}"
                  required
                  autoComplete="one-time-code"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setMfaSetup(null)}>
                  Cancel
                </button>
                <button type="submit" className="verify-btn" disabled={isLoading || verifyCode.length !== 6}>
                  {isLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mfaEnabled && (
          <div className="mfa-disable">
            <p className="warning-text">
              ⚠️ Disabling MFA will make your account less secure. You'll need to enter your password to confirm.
            </p>
            <form onSubmit={handleDisableMfa} className="disable-form">
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={disablePassword}
                    onChange={e => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="disable-btn" disabled={isLoading || !disablePassword}>
                {isLoading ? 'Disabling...' : 'Disable MFA'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="section-header">
          <div>
            <h2>Account Information</h2>
          </div>
        </div>
        <div className="account-info">
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{user?.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Role:</span>
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
