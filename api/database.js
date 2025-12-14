const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dataPath = path.join(__dirname, 'data.json');

// Load or initialize data
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

// Initialize with sample data if empty
let data = loadData();

// Check if admin user exists, if not create initial users
const adminExists = data.users.some(u => u.email === 'ramon.vermin@cascoauto.com');
if (!adminExists) {
  console.log('📦 Seeding database with users and sample data...');
  
  const now = new Date().toISOString();
  
  // Create admin user (ramon.vermin@cascoauto.com)
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

  // Create demo editor user
  data.users.push({
    id: uuidv4(),
    email: 'demo@casco.com',
    password: bcrypt.hashSync('demo1234', 10),
    name: 'Demo Editor',
    role: 'editor',
    mfaEnabled: false,
    mfaSecret: null,
    createdAt: now
  });

  // Create demo reader user
  data.users.push({
    id: uuidv4(),
    email: 'reader@casco.com',
    password: bcrypt.hashSync('reader1234', 10),
    name: 'Demo Reader',
    role: 'reader',
    mfaEnabled: false,
    mfaSecret: null,
    createdAt: now
  });

  data.articles = [
    {
      id: uuidv4(),
      title: 'Breaking: Major Technology Breakthrough Announced',
      summary: 'Scientists reveal a groundbreaking discovery that could revolutionize how we interact with technology in our daily lives.',
      content: `<p>In a stunning announcement today, researchers at the Institute of Advanced Technology revealed what they're calling "the most significant breakthrough in computing since the microprocessor."</p>
<p>The new technology, which has been in development for over a decade, promises to increase processing speeds by a factor of 1000 while reducing energy consumption by 90%.</p>
<p>"This is not just an incremental improvement," said Dr. Sarah Chen, lead researcher on the project. "This is a fundamental shift in how we think about computation."</p>`,
      author: 'Demo Editor',
      category: 'Technology',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
      status: 'published',
      featured: true,
      publishedAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: 'Global Markets Rally on Economic Optimism',
      summary: 'Stock markets around the world posted significant gains as investors respond to positive economic indicators.',
      content: `<p>Global stock markets experienced their best week in months as positive economic data from major economies fueled investor optimism.</p>
<p>The S&P 500 rose 2.3%, while European and Asian markets saw similar gains. The rally was broad-based, with technology, healthcare, and financial sectors all posting strong returns.</p>
<p>"We're seeing a confluence of positive factors," said Maria Rodriguez, chief economist at Global Investments.</p>`,
      author: 'Demo Editor',
      category: 'Business',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      status: 'published',
      featured: true,
      publishedAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      title: 'New Study Reveals Benefits of Mediterranean Diet',
      summary: 'Research confirms that following a Mediterranean-style diet can significantly improve heart health and longevity.',
      content: `<p>A comprehensive study involving over 50,000 participants has provided the strongest evidence yet for the health benefits of the Mediterranean diet.</p>
<p>The research found that individuals who closely followed Mediterranean dietary patterns had a 25% lower risk of cardiovascular disease.</p>
<p>The Mediterranean diet emphasizes fruits, vegetables, whole grains, olive oil, and lean proteins, particularly fish.</p>`,
      author: 'Demo Editor',
      category: 'Health',
      imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
      status: 'published',
      featured: false,
      publishedAt: now,
      updatedAt: now
    }
  ];

  saveData(data);
  console.log('✅ Database seeded successfully');
}

// Database functions
module.exports = {
  // User functions
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
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      mfaEnabled: u.mfaEnabled || false,
      createdAt: u.createdAt
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
      if (adminCount <= 1) {
        return { error: 'Cannot delete the last admin user' };
      }
    }
    data.users = data.users.filter(u => u.id !== id);
    saveData(data);
    return { success: true };
  },

  // MFA functions
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

  // Article functions
  getAllArticles: () => {
    data = loadData();
    return [...data.articles].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  getPublishedArticles: () => {
    data = loadData();
    return data.articles
      .filter(a => a.status === 'published')
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
