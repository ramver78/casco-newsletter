const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'casco-newsletter-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware - requires admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Editor middleware - requires editor or admin role
const requireEditor = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    return res.status(403).json({ error: 'Editor access required' });
  }
  next();
};

// ============ AUTH ROUTES ============

// Allowed email domain for self-registration
const ALLOWED_EMAIL_DOMAIN = '@cascoauto.com';

// Register new user (only @cascoauto.com emails can self-register)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Only allow @cascoauto.com emails to self-register
    if (!email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return res.status(403).json({ 
        error: `Registration is only available for ${ALLOWED_EMAIL_DOMAIN} email addresses. Please contact an administrator if you need access.` 
      });
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const user = db.createUser({
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: 'reader', // @cascoauto.com users are auto-approved as readers
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: now
    });

    // New users must set up MFA - return setup token instead of full access
    const setupToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, mfaSetupOnly: true },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(201).json({
      mfaSetupRequired: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: false },
      setupToken,
      message: 'Account created. Please set up MFA to complete registration.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login - Step 1: Validate credentials
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if MFA is enabled
    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode) {
        // MFA required but no code provided
        return res.json({ 
          mfaRequired: true, 
          message: 'MFA code required',
          userId: user.id 
        });
      }

      // Verify MFA code
      const isValidMfa = authenticator.verify({ token: mfaCode, secret: user.mfaSecret });
      if (!isValidMfa) {
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    // If MFA is not enabled, return a setup-required flag instead of full access
    if (!user.mfaEnabled) {
      // Generate a temporary token for MFA setup only
      const setupToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, mfaSetupOnly: true },
        JWT_SECRET,
        { expiresIn: '15m' } // Short expiry for setup
      );

      return res.json({
        mfaSetupRequired: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: false },
        setupToken,
        message: 'MFA setup is required. Please configure your authenticator app.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: true },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ 
    id: user.id, 
    email: user.email, 
    name: user.name, 
    role: user.role,
    mfaEnabled: user.mfaEnabled || false
  });
});

// ============ MFA ROUTES ============

// Setup MFA - Generate secret and QR code
app.post('/api/auth/mfa/setup', authenticateToken, async (req, res) => {
  try {
    const user = db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'Casco Newsletter', secret);
    
    // Store secret temporarily (not enabled yet)
    db.setMfaSecret(user.id, secret);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauth);

    res.json({ 
      secret, 
      qrCode,
      message: 'Scan QR code with your authenticator app, then verify with a code'
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

// Verify and enable MFA
app.post('/api/auth/mfa/verify', authenticateToken, (req, res) => {
  try {
    const { code } = req.body;
    const user = db.getUserById(req.user.id);
    
    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not set up' });
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    db.enableMfa(user.id);
    res.json({ message: 'MFA enabled successfully', mfaEnabled: true });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
});

// Disable MFA
app.post('/api/auth/mfa/disable', authenticateToken, (req, res) => {
  try {
    const { password } = req.body;
    const user = db.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Require password to disable MFA
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    db.disableMfa(user.id);
    res.json({ message: 'MFA disabled successfully', mfaEnabled: false });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// ============ USER MANAGEMENT ROUTES (Admin only) ============

// Get all users
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
app.put('/api/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'editor', 'reader'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, editor, or reader' });
    }

    const user = db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent removing last admin
    if (user.role === 'admin' && role !== 'admin') {
      const allUsers = db.getAllUsers();
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }

    db.updateUser(req.params.id, { role });
    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Cannot delete yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = db.deleteUser(req.params.id);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Create user (Admin only)
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const validRoles = ['admin', 'editor', 'reader'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const user = db.createUser({
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role: role || 'reader',
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: now
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ============ ARTICLE ROUTES ============

// Get all published articles (public)
app.get('/api/articles', (req, res) => {
  try {
    const articles = db.getPublishedArticles();
    res.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get all articles for editors (requires auth)
app.get('/api/articles/all', authenticateToken, (req, res) => {
  try {
    const articles = db.getAllArticles();
    res.json(articles);
  } catch (error) {
    console.error('Get all articles error:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get single article by ID
app.get('/api/articles/:id', (req, res) => {
  try {
    const article = db.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Create article (requires auth)
app.post('/api/articles', authenticateToken, (req, res) => {
  try {
    const { title, summary, content, category, imageUrl, status, featured } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const user = db.getUserById(req.user.id);
    const now = new Date().toISOString();

    const article = db.createArticle({
      id: uuidv4(),
      title,
      summary: summary || '',
      content,
      author: user.name,
      category: category || 'General',
      imageUrl: imageUrl || null,
      status: status || 'draft',
      featured: featured ? 1 : 0,
      publishedAt: now,
      updatedAt: now
    });

    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Update article (requires auth)
app.put('/api/articles/:id', authenticateToken, (req, res) => {
  try {
    const { title, summary, content, category, imageUrl, status, featured } = req.body;

    const existing = db.getArticleById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = db.updateArticle(req.params.id, {
      title: title ?? existing.title,
      summary: summary ?? existing.summary,
      content: content ?? existing.content,
      category: category ?? existing.category,
      imageUrl: imageUrl ?? existing.imageUrl,
      status: status ?? existing.status,
      featured: featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      updatedAt: new Date().toISOString()
    });

    res.json(article);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete article (requires auth)
app.delete('/api/articles/:id', authenticateToken, (req, res) => {
  try {
    const existing = db.getArticleById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Article not found' });
    }

    db.deleteArticle(req.params.id);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// ============ CATEGORIES ROUTE ============

app.get('/api/categories', (req, res) => {
  const categories = [
    { id: '1', name: 'Technology', slug: 'technology', color: '#3b82f6' },
    { id: '2', name: 'Business', slug: 'business', color: '#10b981' },
    { id: '3', name: 'Health', slug: 'health', color: '#ef4444' },
    { id: '4', name: 'Sports', slug: 'sports', color: '#f59e0b' },
    { id: '5', name: 'Entertainment', slug: 'entertainment', color: '#8b5cf6' },
  ];
  res.json(categories);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Casco Newsletter API running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);
});
