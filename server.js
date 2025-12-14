// Combined server for Azure App Service
// Serves both the React frontend and API backend

const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'casco-newsletter-production-secret-change-me';

// Data storage path
const dataPath = process.env.DATA_PATH || path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// ============ DATABASE FUNCTIONS ============

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return { users: [], articles: [] };
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

let data = loadData();

// Seed initial data if empty
const adminExists = data.users.some(u => u.email === 'ramon.vermin@cascoauto.com');
if (!adminExists) {
  console.log('📦 Seeding database with initial data...');
  const now = new Date().toISOString();
  
  data.users.push({
    id: uuidv4(),
    email: 'ramon.vermin@cascoauto.com',
    password: bcrypt.hashSync('admin1234', 10),
    name: 'Ramon Vermin',
    role: 'admin',
    mfaEnabled: false,
    mfaSecret: null,
    createdAt: now
  });

  data.articles = [{
    id: uuidv4(),
    title: 'Welcome to Casco Newsletter',
    summary: 'Your source for company news and updates.',
    content: '<p>Welcome to the Casco Newsletter platform. Stay tuned for exciting updates!</p>',
    author: 'Ramon Vermin',
    category: 'General',
    imageUrl: null,
    status: 'published',
    featured: 1,
    publishedAt: now,
    updatedAt: now
  }];

  saveData(data);
  console.log('✅ Database seeded successfully');
}

// Database helpers
const db = {
  getUserByEmail: (email) => {
    data = loadData();
    return data.users.find(u => u.email === email);
  },
  getUserById: (id) => {
    data = loadData();
    return data.users.find(u => u.id === id);
  },
  getAllUsers: () => {
    data = loadData();
    return data.users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role,
      mfaEnabled: u.mfaEnabled || false, createdAt: u.createdAt
    }));
  },
  createUser: (user) => {
    data = loadData();
    data.users.push(user);
    saveData(data);
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
  updateUser: (id, updates) => {
    data = loadData();
    const index = data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updates };
      saveData(data);
      return data.users[index];
    }
    return null;
  },
  deleteUser: (id) => {
    data = loadData();
    const user = data.users.find(u => u.id === id);
    if (user && user.role === 'admin') {
      const adminCount = data.users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) return { error: 'Cannot delete the last admin user' };
    }
    data.users = data.users.filter(u => u.id !== id);
    saveData(data);
    return { success: true };
  },
  setMfaSecret: (userId, secret) => {
    data = loadData();
    const index = data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      data.users[index].mfaSecret = secret;
      saveData(data);
      return true;
    }
    return false;
  },
  enableMfa: (userId) => {
    data = loadData();
    const index = data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      data.users[index].mfaEnabled = true;
      saveData(data);
      return true;
    }
    return false;
  },
  disableMfa: (userId) => {
    data = loadData();
    const index = data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      data.users[index].mfaEnabled = false;
      data.users[index].mfaSecret = null;
      saveData(data);
      return true;
    }
    return false;
  },
  getAllArticles: () => {
    data = loadData();
    return [...data.articles].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },
  getPublishedArticles: () => {
    data = loadData();
    return data.articles.filter(a => a.status === 'published')
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  },
  getArticleById: (id) => {
    data = loadData();
    return data.articles.find(a => a.id === id) || null;
  },
  createArticle: (article) => {
    data = loadData();
    data.articles.unshift(article);
    saveData(data);
    return article;
  },
  updateArticle: (id, updates) => {
    data = loadData();
    const index = data.articles.findIndex(a => a.id === id);
    if (index !== -1) {
      data.articles[index] = { ...data.articles[index], ...updates };
      saveData(data);
      return data.articles[index];
    }
    return null;
  },
  deleteArticle: (id) => {
    data = loadData();
    data.articles = data.articles.filter(a => a.id !== id);
    saveData(data);
  }
};

// ============ MIDDLEWARE ============

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// ============ AUTH ROUTES ============

const ALLOWED_EMAIL_DOMAIN = '@cascoauto.com';

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    if (!email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return res.status(403).json({ error: `Registration is only available for ${ALLOWED_EMAIL_DOMAIN} email addresses.` });
    }
    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = db.createUser({
      id: uuidv4(),
      email: email.toLowerCase(),
      name,
      role: 'reader',
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: new Date().toISOString()
    });

    const setupToken = jwt.sign({ id: user.id, email: user.email, role: user.role, mfaSetupOnly: true }, JWT_SECRET, { expiresIn: '15m' });
    res.status(201).json({ mfaSetupRequired: true, user: { ...user, mfaEnabled: false }, setupToken });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Passwordless login - email + MFA code only
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, mfaCode } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.getUserByEmail(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'User not found. Please register first.' });

    // If MFA is not set up, redirect to setup
    if (!user.mfaEnabled || !user.mfaSecret) {
      const setupToken = jwt.sign({ id: user.id, email: user.email, role: user.role, mfaSetupOnly: true }, JWT_SECRET, { expiresIn: '15m' });
      return res.json({ mfaSetupRequired: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: false }, setupToken });
    }

    // MFA code required
    if (!mfaCode) {
      return res.json({ mfaRequired: true, userId: user.id });
    }

    // Verify MFA code
    const isValidMfa = authenticator.verify({ token: mfaCode, secret: user.mfaSecret });
    if (!isValidMfa) return res.status(401).json({ error: 'Invalid MFA code' });

    // Success - issue token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: true }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, mfaEnabled: user.mfaEnabled || false });
});

// ============ MFA ROUTES ============

app.post('/api/auth/mfa/setup', authenticateToken, async (req, res) => {
  try {
    const user = db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'Casco Newsletter', secret);
    db.setMfaSecret(user.id, secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    res.json({ secret, qrCode });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

app.post('/api/auth/mfa/verify', authenticateToken, (req, res) => {
  try {
    const { code } = req.body;
    const user = db.getUserById(req.user.id);
    if (!user || !user.mfaSecret) return res.status(400).json({ error: 'MFA not set up' });

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) return res.status(400).json({ error: 'Invalid verification code' });

    db.enableMfa(user.id);
    res.json({ mfaEnabled: true });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
});

app.post('/api/auth/mfa/disable', authenticateToken, (req, res) => {
  try {
    const { password } = req.body;
    const user = db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    db.disableMfa(user.id);
    res.json({ mfaEnabled: false });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// ============ USER MANAGEMENT ROUTES ============

app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  res.json(db.getAllUsers());
});

app.put('/api/users/:id/role', authenticateToken, requireAdmin, (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'editor', 'reader'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'admin' && role !== 'admin') {
    const adminCount = db.getAllUsers().filter(u => u.role === 'admin').length;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot remove the last admin' });
  }

  db.updateUser(req.params.id, { role });
  res.json({ role });
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  const result = db.deleteUser(req.params.id);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ message: 'User deleted' });
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });
    if (db.getUserByEmail(email)) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.createUser({
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role || 'reader',
      mfaEnabled: false,
      mfaSecret: null,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ============ ARTICLE ROUTES ============

app.get('/api/articles', (req, res) => {
  res.json(db.getPublishedArticles());
});

app.get('/api/articles/all', authenticateToken, (req, res) => {
  res.json(db.getAllArticles());
});

app.get('/api/articles/:id', (req, res) => {
  const article = db.getArticleById(req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

app.post('/api/articles', authenticateToken, (req, res) => {
  const { title, summary, content, category, imageUrl, status, featured } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

  const user = db.getUserById(req.user.id);
  const now = new Date().toISOString();
  const article = db.createArticle({
    id: uuidv4(), title, summary: summary || '', content,
    author: user.name, category: category || 'General',
    imageUrl: imageUrl || null, status: status || 'draft',
    featured: featured ? 1 : 0, publishedAt: now, updatedAt: now
  });
  res.status(201).json(article);
});

app.put('/api/articles/:id', authenticateToken, (req, res) => {
  const existing = db.getArticleById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Article not found' });

  const { title, summary, content, category, imageUrl, status, featured } = req.body;
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
});

app.delete('/api/articles/:id', authenticateToken, (req, res) => {
  if (!db.getArticleById(req.params.id)) return res.status(404).json({ error: 'Article not found' });
  db.deleteArticle(req.params.id);
  res.json({ message: 'Article deleted' });
});

// ============ OTHER ROUTES ============

app.get('/api/categories', (req, res) => {
  res.json([
    { id: '1', name: 'Technology', slug: 'technology', color: '#3b82f6' },
    { id: '2', name: 'Business', slug: 'business', color: '#10b981' },
    { id: '3', name: 'Health', slug: 'health', color: '#ef4444' },
    { id: '4', name: 'Sports', slug: 'sports', color: '#f59e0b' },
    { id: '5', name: 'Entertainment', slug: 'entertainment', color: '#8b5cf6' },
  ]);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Casco Newsletter running on port ${PORT}`);
});
