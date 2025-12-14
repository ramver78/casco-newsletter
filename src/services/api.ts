const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005/api';

// Helper to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('casco_token');
};

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API - Passwordless (email + MFA only)
export const authApi = {
  login: async (email: string, mfaCode?: string) => {
    const data = await apiRequest<{ 
      user?: any; 
      token?: string; 
      mfaRequired?: boolean; 
      mfaSetupRequired?: boolean;
      setupToken?: string;
      userId?: string 
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mfaCode }),
    });
    
    if (data.mfaRequired) {
      return { mfaRequired: true, userId: data.userId };
    }
    
    if (data.mfaSetupRequired) {
      localStorage.setItem('casco_setup_token', data.setupToken || '');
      localStorage.setItem('casco_user', JSON.stringify(data.user));
      return { mfaSetupRequired: true, user: data.user };
    }
    
    if (data.token && data.user) {
      localStorage.setItem('casco_token', data.token);
      localStorage.setItem('casco_user', JSON.stringify(data.user));
      localStorage.removeItem('casco_setup_token');
    }
    return data;
  },

  register: async (email: string, name: string) => {
    const data = await apiRequest<{ 
      user: any; 
      token?: string; 
      setupToken?: string;
      mfaSetupRequired?: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    
    if (data.mfaSetupRequired && data.setupToken) {
      localStorage.setItem('casco_setup_token', data.setupToken);
      localStorage.setItem('casco_user', JSON.stringify(data.user));
      return { mfaSetupRequired: true, user: data.user };
    }
    
    if (data.token) {
      localStorage.setItem('casco_token', data.token);
      localStorage.setItem('casco_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('casco_token');
    localStorage.removeItem('casco_user');
  },

  getCurrentUser: async () => {
    return apiRequest<any>('/auth/me');
  },

  getStoredUser: () => {
    const user = localStorage.getItem('casco_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!getToken();
  },

  // MFA
  setupMfa: async () => {
    // Use setup token if available (for forced MFA setup)
    const setupToken = localStorage.getItem('casco_setup_token');
    const headers: Record<string, string> = {};
    if (setupToken) {
      headers['Authorization'] = `Bearer ${setupToken}`;
    }
    return apiRequest<{ secret: string; qrCode: string }>('/auth/mfa/setup', {
      method: 'POST',
      headers,
    });
  },

  verifyAndCompleteMfaSetup: async (code: string, email: string) => {
    const setupToken = localStorage.getItem('casco_setup_token');
    if (!setupToken) {
      throw new Error('Setup session expired. Please login again.');
    }

    await apiRequest('/auth/mfa/verify', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${setupToken}` },
      body: JSON.stringify({ code }),
    });

    // Now login again with MFA code to get full access token
    localStorage.removeItem('casco_setup_token');
    return authApi.login(email, code);
  },

  verifyMfa: async (code: string) => {
    return apiRequest<{ mfaEnabled: boolean }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  disableMfa: async (password: string) => {
    return apiRequest<{ mfaEnabled: boolean }>('/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
};

// Users API (Admin only)
export const usersApi = {
  getAll: async () => {
    return apiRequest<any[]>('/users');
  },

  create: async (userData: { email: string; password: string; name: string; role?: string }) => {
    return apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateRole: async (userId: string, role: string) => {
    return apiRequest<any>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  delete: async (userId: string) => {
    return apiRequest<any>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

// Articles API
export const articlesApi = {
  getPublished: async () => {
    return apiRequest<any[]>('/articles');
  },

  getAll: async () => {
    return apiRequest<any[]>('/articles/all');
  },

  getById: async (id: string) => {
    return apiRequest<any>(`/articles/${id}`);
  },

  create: async (article: any) => {
    return apiRequest<any>('/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  },

  update: async (id: string, article: any) => {
    return apiRequest<any>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article),
    });
  },

  delete: async (id: string) => {
    return apiRequest<any>(`/articles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Categories API
export const categoriesApi = {
  getAll: async () => {
    return apiRequest<any[]>('/categories');
  },
};
