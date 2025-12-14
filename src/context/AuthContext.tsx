import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaSetupRequired: boolean;
  pendingEmail: string | null;
  login: (email: string, mfaCode?: string) => Promise<boolean | 'mfa_required' | 'mfa_setup_required'>;
  register: (email: string, name: string) => Promise<boolean | 'mfa_setup_required'>;
  completeMfaSetup: (code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = authApi.getStoredUser();
    const setupToken = localStorage.getItem('casco_setup_token');
    
    if (setupToken && storedUser) {
      setUser(storedUser);
      setMfaSetupRequired(true);
      setPendingEmail(storedUser.email);
    } else if (storedUser && authApi.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, mfaCode?: string): Promise<boolean | 'mfa_required' | 'mfa_setup_required'> => {
    try {
      const result = await authApi.login(email, mfaCode);
      
      if (result.mfaRequired) {
        setPendingEmail(email);
        return 'mfa_required';
      }
      
      if (result.mfaSetupRequired) {
        setUser(result.user);
        setMfaSetupRequired(true);
        setPendingEmail(email);
        return 'mfa_setup_required';
      }
      
      if (result.user) {
        setUser(result.user);
        setMfaSetupRequired(false);
        setPendingEmail(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, name: string): Promise<boolean | 'mfa_setup_required'> => {
    try {
      const result = await authApi.register(email, name);
      
      if (result.mfaSetupRequired) {
        setUser(result.user);
        setMfaSetupRequired(true);
        setPendingEmail(email);
        return 'mfa_setup_required';
      }
      
      setUser(result.user);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const completeMfaSetup = async (code: string): Promise<boolean> => {
    if (!pendingEmail) {
      throw new Error('No pending email. Please login again.');
    }
    
    try {
      const result = await authApi.verifyAndCompleteMfaSetup(code, pendingEmail);
      
      if (result.user) {
        setUser({ ...result.user, mfaEnabled: true });
        setMfaSetupRequired(false);
        setPendingEmail(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('MFA setup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem('casco_setup_token');
    setUser(null);
    setMfaSetupRequired(false);
    setPendingEmail(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user && !mfaSetupRequired, 
      isLoading, 
      mfaSetupRequired,
      pendingEmail,
      login, 
      register, 
      completeMfaSetup,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
