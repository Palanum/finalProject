const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const sequelize = require('../db'); // Sequelize instance
const { Sequelize, Op } = require('sequelize'); // add Op

const {
  Category,
  Comment,
  DataIngredient,
  Favorite,
  Ingredient,
  Instruction,
  InstructionImg,
  Like,
  Recipe,
  RecipeCategory,
  RecipeView,
  Report,
  ReportEvidence,
  User
} = require('../models');

// ===== REGISTER =====
router.post('/register', async (req, res) => {
  const t = await sequelize.transaction(); // start transaction
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check existing user/email
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      },
      transaction: t
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const stat_update = new Date();

    // Create user
    const user = await User.create({
      username,
      password_hash,
      email,
      role: 'user',
      status: 'normal',
      stat_update
    }, { transaction: t });

    await t.commit();

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };

    return res.json({
      message: 'User registered successfully',
      user: req.session.user
    });

  } catch (err) {
    await t.rollback();
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

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

    return res.json({
      message: 'Login successful',
      user: req.session.user
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
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

    // Update user in DB
    await User.update(
      { password_hash: hashedPassword, updated_at: new Date() },
      { where: { id: req.session.user.id } }
    );

    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ ✅" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
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

// Add/remove favorite
router.post('/:id/favorite', async (req, res) => {
  const { id: RecipeID } = req.params;
  const { action } = req.body;

  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const UserID = req.session.user.id;

  try {
    if (action === 'add') {
      await Favorite.findOrCreate({ where: { UserID, RecipeID } });
      return res.json({ message: 'Added to favorites', isFavorite: true });
    } else if (action === 'remove') {
      await Favorite.destroy({ where: { UserID, RecipeID } });
      return res.json({ message: 'Removed from favorites', isFavorite: false });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Favorite error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add/remove like
router.post('/:id/like', async (req, res) => {
  const { id: RecipeID } = req.params;
  const { action } = req.body;

  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const UserID = req.session.user.id;

  try {
    if (action === 'add') {
      await Like.findOrCreate({ where: { UserID, RecipeID } });
      return res.json({ message: 'Added to likes', isLike: true });
    } else if (action === 'remove') {
      await Like.destroy({ where: { UserID, RecipeID } });
      return res.json({ message: 'Removed from likes', isLike: false });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Like error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/favorites", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const userId = req.session.user.id;

  try {
    const favorites = await Favorite.findAll({
      where: { UserID: userId },
      include: { model: Recipe }
    });
    res.json(favorites.map(f => ({
      RecipeID: f.Recipe.RecipeID,
      Title: f.Recipe.Title,
      ImageURL: f.Recipe.ImageURL,
      videoURL: f.Recipe.videoURL,
      time: f.Recipe.time,
      CreatedAt: f.CreatedAt
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/my_recipes", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const userId = req.session.user.id;

  try {
    const recipes = await Recipe.findAll({ where: { UserID: userId } });
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/alarm/count", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const userId = req.session.user.id;

  try {
    const user = await User.findByPk(userId);
    const lastView = user.last_alarm_view || new Date(0);

    const likesCount = await Like.count({
      include: { model: Recipe, where: { UserID: userId } },
      where: { UserID: { [Op.ne]: userId }, CreatedAt: { [Op.gt]: lastView } }
    });

    const favoritesCount = await Favorite.count({
      include: { model: Recipe, where: { UserID: userId } },
      where: { UserID: { [Op.ne]: userId }, CreatedAt: { [Op.gt]: lastView } }
    });

    const commentsCount = await Comment.count({
      include: { model: Recipe, where: { UserID: userId } },
      where: { UserID: { [Op.ne]: userId }, CreatedAt: { [Op.gt]: lastView } }
    });

    res.json({ count: likesCount + favoritesCount + commentsCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/alarm", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const userId = req.session.user.id;

  try {
    const user = await User.findByPk(userId);
    const lastView = user.last_alarm_view || new Date(0);

    // Get likes, favorites, comments that happened after last view
    const likes = await Like.findAll({
      include: [
        { model: Recipe, where: { UserID: userId } },
        { model: User, attributes: ['username'] }
      ],
      where: { UserID: { [Op.ne]: userId } }
    });

    const favorites = await Favorite.findAll({
      include: [
        { model: Recipe, where: { UserID: userId } },
        { model: User, attributes: ['username'] }
      ],
      where: { UserID: { [Op.ne]: userId } }
    });

    const comments = await Comment.findAll({
      include: [
        { model: Recipe, where: { UserID: userId } },
        { model: User, attributes: ['username'] }
      ],
      where: { UserID: { [Op.ne]: userId } }
    });

    const alarms = [
      ...likes.map(l => ({
        type: 'like',
        actorUsername: l.User.username, // 🔑 uppercase U
        RecipeID: l.RecipeID,
        recipeTitle: l.Recipe.Title,
        recipeImage: l.Recipe.ImageURL,
        CreatedAt: l.CreatedAt,
        isRead: l.CreatedAt <= lastView
      })),
      ...favorites.map(f => ({
        type: 'favorite',
        actorUsername: f.User.username, // 🔑 uppercase U
        RecipeID: f.RecipeID,
        recipeTitle: f.Recipe.Title,
        recipeImage: f.Recipe.ImageURL,
        CreatedAt: f.CreatedAt,
        isRead: f.CreatedAt <= lastView
      })),
      ...comments.map(c => ({
        type: 'comment',
        actorUsername: c.User.username, // 🔑 uppercase U
        RecipeID: c.RecipeID,
        recipeTitle: c.Recipe.Title,
        recipeImage: c.Recipe.ImageURL,
        CreatedAt: c.CreatedAt,
        isRead: c.CreatedAt <= lastView
      })),
    ];


    alarms.sort((a, b) => b.CreatedAt - a.CreatedAt); // newest first

    res.json(alarms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/alarm/mark-read", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const userId = req.session.user.id;

  try {
    await User.update({ last_alarm_view: new Date() }, { where: { id: userId } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.uploader.upload_stream_async = function (buffer, options = {}) {
  const streamifier = require('streamifier');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

router.post("/:id/report", upload.array("images"), async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const reporterId = req.session.user.id;
  const { reason, reported_id, type } = req.body;

  try {
    // Create a report entry in the database
    const report = await Report.create({
      Reporter_id: reporterId,
      reason,
      reported_type: type,
      reported_id: reported_id,
      status: 'pending',
      created_on: new Date()
    });
    const ReportID = report.ReportID;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await cloudinary.uploader.upload_stream_async(
          file.buffer,
          { folder: `image_project/report_image/report_${reported_id}` }
        );

        await ReportEvidence.create({
          ReportID,
          file_url: uploaded.secure_url,
          file_type: uploaded.resource_type,
          created_on: new Date(),
        });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
}

router.get("/admin/data", requireAdmin, async (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });

  if (req.session.user.role !== 'admin')
    return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });

  try {
    // Total counts
    const userCount = await User.count();
    const recipeCount = await Recipe.count();
    const pendingReportCount = await Report.count({ where: { status: 'pending' } });

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUserCount = await User.count({
      where: {
        created_at: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const recentRecipeCount = await Recipe.count({
      where: {
        CreatedAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    return res.json({
      counts: {
        totalUsers: userCount,
        usersLast30Days: recentUserCount,
        totalRecipes: recipeCount,
        recipesLast30Days: recentRecipeCount,
        pendingReports: pendingReportCount
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/admin/user', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status', 'created_at', 'updated_at']
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * BAN or UNBAN a user
 */
router.patch('/admin/user/:id/ban', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action, days } = req.body; // days is used only for "ban"

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'ban') {
      if (!days || isNaN(days) || days < 1) {
        return res.status(400).json({ error: 'Invalid number of days' });
      }
      user.status = 'banned';
      // Set stat_update to the unban date
      const unbanDate = new Date();
      unbanDate.setDate(unbanDate.getDate() + parseInt(days));
      user.stat_update = unbanDate;
    } else if (action === 'unban') {
      user.status = 'normal';
      user.stat_update = new Date(); // now
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await user.save();
    res.json({ message: `User ${action}ned successfully`, user });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


/**
 * DELETE a user
 */
router.delete('/admin/user/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/admin/user/:id/alarm', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Create alarm entry in Comment table
    const alarm = await Comment.create({
      RecipeID: null, // not tied to a recipe
      UserID: user.id,
      ParentCommentID: null,
      Content: message,
      type: 'alarm',
      CreatedAt: new Date(),
    });

    res.json({ message: 'Alarm sent successfully', alarm });
  } catch (err) {
    console.error('Error sending alarm:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.patch('/admin/user/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== AUTH CHECK =====
// GET /api/users/me
router.get('/me', (req, res) => {
  if (req.session?.user) return res.json({ user: req.session.user });
  res.status(401).json({ user: null });
});


module.exports = router;
