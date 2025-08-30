const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const pool = require('../db');

// ===== REGISTER =====
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const stat_update = new Date();
    const role = 'user';
    const status = 'normal';

    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, email, stat_update, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, password_hash, email, stat_update, role, status]
    );

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  // console.log('Login request received:', req.body);
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };
    // console.log('Session after login:', req.session);
    // Send JSON response with user info
    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// ===== LOGOUT =====
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    // console.log('Session after logout:', req.session);
    res.clearCookie('connect.sid'); // default cookie name
    res.json({ message: 'Logout successful' });
  });

});

router.post('/:id/favorite', (req, res) => {
  const { id } = req.params; // RecipeID
  const { action } = req.body;

  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  // console.log(`User ${userId} requests to ${action} favorite for recipe ${id}`);
  if (action === 'add') {
    pool.query(
      'INSERT IGNORE INTO favorites (UserID, RecipeID) VALUES (?, ?)',
      [userId, id],
      (error) => {
        if (error) {
          console.error('Error adding favorite:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Added to favorites', isFavorite: true });
      }
    );
  } else if (action === 'remove') {
    pool.query(
      'DELETE FROM favorites WHERE UserID = ? AND RecipeID = ?',
      [userId, id],
      (error) => {
        if (error) {
          console.error('Error removing favorite:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Removed from favorites', isFavorite: false });
      }
    );
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

router.post('/:id/like', (req, res) => {
  const { id } = req.params; // RecipeID
  const { action } = req.body;

  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.session.user.id;
  // console.log(`User ${userId} requests to ${action} favorite for recipe ${id}`);
  if (action === 'add') {
    pool.query(
      'INSERT IGNORE INTO likes (UserID, RecipeID) VALUES (?, ?)',
      [userId, id],
      (error) => {
        if (error) {
          console.error('Error adding like:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Added to likes', isLike: true });
      }
    );
  } else if (action === 'remove') {
    pool.query(
      'DELETE FROM likes WHERE UserID = ? AND RecipeID = ?',
      [userId, id],
      (error) => {
        if (error) {
          console.error('Error removing like:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Removed from likes', isLike: false });
      }
    );
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});
// ===== AUTH CHECK =====
// GET /api/users/me
router.get('/me', (req, res) => {
  if (req.session?.user) return res.json({ user: req.session.user });
  res.status(401).json({ user: null });
});


module.exports = router;
