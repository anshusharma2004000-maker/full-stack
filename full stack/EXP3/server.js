const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(bodyParser.json());

// Serve static client
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory user store (mock) with roles
const users = [
  { username: 'admin', password: 'adminpass', name: 'Site Admin', role: 'admin' },
  { username: 'editor', password: 'editorpass', name: 'Content Editor', role: 'editor' },
  { username: 'viewer', password: 'viewerpass', name: 'Read Only', role: 'viewer' }
];

function generateToken(user) {
  const payload = { username: user.username, name: user.name, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token });
});

// middleware to protect routes
function authenticate(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });

  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

// Protected endpoint example
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ profile: req.user });
});

// Protected posts endpoint: echo post and keep simple in-memory array
const posts = [];
// Accept social platform names or custom names validated by regex
const platformRe = /^[a-z0-9-_]{1,30}$/i;

app.get('/api/platforms', (req, res) => {
  // return default social options; client may add custom names locally
  res.json({ platforms: ['twitter','instagram','facebook','linkedin'] });
});

app.post('/api/posts', authenticate, (req, res) => {
  const { content, platform } = req.body || {};
  if (!content) return res.status(400).json({ error: 'Missing post content' });
  // Only allow users with role 'admin' or 'editor' to create posts
  const role = req.user && req.user.role;
  if (role !== 'admin' && role !== 'editor') return res.status(403).json({ error: 'Insufficient permissions to create post' });

  const selectedPlatform = (platform || 'twitter').toString().toLowerCase();
  if (!platformRe.test(selectedPlatform)) return res.status(400).json({ error: 'Invalid platform name' });

  const post = { id: posts.length + 1, author: req.user.username, name: req.user.name, role, platform: selectedPlatform, content, createdAt: new Date().toISOString() };
  posts.unshift(post);
  res.json({ post });
});

app.get('/api/posts', authenticate, (req, res) => {
  res.json({ posts });
});

// fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
