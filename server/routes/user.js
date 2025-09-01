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

router.post("/change-password", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update DB (Mongoose example)
    await pool.execute(
      `UPDATE users 
       SET password_hash = ?, updated_at = NOW() 
       WHERE id = ?`,
      [hashedPassword, req.session.user.id]
    );

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ ✅" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

router.get("/favorites", async (req, res) => {
  try {
    // console.log('Get favorites request, session:', req.session.user);
    if (!req.session?.user) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
    }
    const userId = req.session.user.id;
    const [rows] = await pool.execute(
      `SELECT r.RecipeID, r.Title, r.ImageURL, r.videoURL, r.time, f.CreatedAt
       FROM favorites f
       JOIN recipes r ON f.RecipeID = r.RecipeID
       WHERE f.UserID = ?`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get favorites error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});
router.get("/my_recipes", async (req, res) => {
  try {
    // console.log('Get favorites request, session:', req.session.user);
    if (!req.session?.user) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
    }
    const userId = req.session.user.id;
    const [rows] = await pool.execute(
      `SELECT r.RecipeID, r.Title, r.ImageURL, r.videoURL, r.time
       FROM recipes r
       WHERE r.UserID = ?`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get my recipes error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

router.get("/alarm/count", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });

  const userId = req.session.user.id;

  try {
    const [[user]] = await pool.execute(
      "SELECT last_alarm_view FROM users WHERE id = ?",
      [userId]
    );
    const lastView = user?.last_alarm_view || "1970-01-01 00:00:00";

    const [[{ count }]] = await pool.execute(
      `
      SELECT COUNT(*) AS count FROM (
        SELECT l.RecipeID FROM likes l
        JOIN recipes r ON l.RecipeID = r.RecipeID
        WHERE r.UserID = ? AND l.UserID != ? AND l.CreatedAt > ?
        UNION ALL
        SELECT f.RecipeID FROM favorites f
        JOIN recipes r ON f.RecipeID = r.RecipeID
        WHERE r.UserID = ? AND f.UserID != ? AND f.CreatedAt > ?
        UNION ALL
        SELECT c.RecipeID FROM comments c
        JOIN recipes r ON c.RecipeID = r.RecipeID
        WHERE r.UserID = ? AND c.UserID != ? AND c.CreatedAt > ?
      ) AS alarms
      `,
      [userId, userId, lastView, userId, userId, lastView, userId, userId, lastView]
    );

    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/alarm", async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  }

  const userId = req.session.user.id;

  try {
    const [[user]] = await pool.execute(
      "SELECT last_alarm_view FROM users WHERE id = ?",
      [userId]
    );
    const lastView = user?.last_alarm_view || "1970-01-01 00:00:00";

    const [alarms] = await pool.execute(
      `
      SELECT 'like' AS type, u.username AS actorUsername, l.RecipeID, r.Title AS recipeTitle, r.ImageURL AS recipeImage, l.CreatedAt,
        l.CreatedAt <= ? AS isRead
      FROM likes l
      JOIN recipes r ON l.RecipeID = r.RecipeID
      JOIN users u ON l.UserID = u.id
      WHERE r.UserID = ? AND l.UserID != ?

      UNION ALL

      SELECT 'favorite' AS type, u.username AS actorUsername, f.RecipeID, r.Title AS recipeTitle, r.ImageURL AS recipeImage, f.CreatedAt,
        f.CreatedAt <= ? AS isRead
      FROM favorites f
      JOIN recipes r ON f.RecipeID = r.RecipeID
      JOIN users u ON f.UserID = u.id
      WHERE r.UserID = ? AND f.UserID != ?

      UNION ALL

      SELECT 'comment' AS type, u.username AS actorUsername, c.RecipeID, r.Title AS recipeTitle, r.ImageURL AS recipeImage, c.CreatedAt,
        c.CreatedAt <= ? AS isRead
      FROM comments c
      JOIN recipes r ON c.RecipeID = r.RecipeID
      JOIN users u ON c.UserID = u.id
      WHERE r.UserID = ? AND c.UserID != ?

      ORDER BY CreatedAt DESC
      `,
      [
        lastView, userId, userId,
        lastView, userId, userId,
        lastView, userId, userId
      ]
    );

    res.json(alarms);

  } catch (err) {
    console.error("Get alarms error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

router.post("/alarm/mark-read", async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  }

  const userId = req.session.user.id;

  try {
    await pool.execute(
      "UPDATE users SET last_alarm_view = NOW() WHERE id = ?",
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark alarms read error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});





// ===== AUTH CHECK =====
// GET /api/users/me
router.get('/me', (req, res) => {
  if (req.session?.user) return res.json({ user: req.session.user });
  res.status(401).json({ user: null });
});


module.exports = router;
