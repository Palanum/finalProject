require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = 5000;

const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
const recipeRoute = require('./routes/recipe');
const outsourceRoute = require('./routes/outsource');

app.use(cors({
  origin: 'http://localhost:3000',   // React app origin
  credentials: true,                 // Allow cookies
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // true if HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
    sameSite: 'lax', // or 'strict' to reduce cookies sent cross-site
    httpOnly: true,
  }
}));
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Cookies:', req.headers.cookie);
  console.log('Request headers size:', JSON.stringify(req.headers).length);
  next();
});

// Mount routes with prefixes:
app.use('/api', mainRoute);             // e.g., GET /api/health
app.use('/api/users', userRoute);       // e.g., POST /api/users/login
app.use('/api/recipes', recipeRoute);   // e.g., GET /api/recipes/
app.use('/api/outsource', outsourceRoute); // e.g., GET /api/outsource/

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
