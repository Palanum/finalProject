const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const sequelize = require('../db'); // Sequelize instance
const { Sequelize, Op } = require('sequelize'); // add Op
const { sendAlarmRequest } = require('../utils/alarmUser');

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
      return res.status(400).json({ error: 'ต้องกรอกข้อมูลทั้งหมด' });
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
      return res.status(400).json({ error: 'ชื่อผู้ใช้หรืออีเมลถูกใช้ไปแล้ว' });
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
      message: 'ลงทะเบียนสำเร็จ',
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
      return res.status(400).json({ error: 'ต้องมีชื่อผู้ใช้และรหัสผ่าน' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ไม่มีในระบบ' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'ชือผู้ใช้หรือรหัสผ่านผิด' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      stat_update: user.stat_update,
      status: user.status
    };

    return res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
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
    res.status(500).json({ error: "Server error" });
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
    res.json({ message: 'ออกจากระบบสำเร็จ' });
  });

});

// Add/remove favorite
router.post('/:id/favorite', async (req, res) => {
  const { id: RecipeID } = req.params;
  const { action } = req.body;

  if (!req.session?.user) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
  }

  const UserID = req.session.user.id;

  try {
    if (action === 'add') {
      await Favorite.findOrCreate({ where: { UserID, RecipeID } });
      return res.json({ message: 'เพิ่มรายการโปรดแล้ว', isFavorite: true });
    } else if (action === 'remove') {
      await Favorite.destroy({ where: { UserID, RecipeID } });
      return res.json({ message: 'ลบรายการโปรดแล้ว', isFavorite: false });
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
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
  }

  const UserID = req.session.user.id;

  try {
    if (action === 'add') {
      await Like.findOrCreate({ where: { UserID, RecipeID } });
      return res.json({ message: 'เพิ่มเมนูที่ชอบแล้ว', isLike: true });
    } else if (action === 'remove') {
      await Like.destroy({ where: { UserID, RecipeID } });
      return res.json({ message: 'ลบเมนูที่ชอบแล้ว', isLike: false });
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

const { uploadImage, upload, deleteImage } = require('../utils/cloudinary');

async function requireOwner(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  }

  const userId = req.session.user.id;
  const recipeId = req.params.id;

  try {
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) return res.status(404).json({ error: "ไม่พบสูตรอาหาร" });

    if (recipe.UserID !== userId) {
      return res.status(403).json({ error: "คุณไม่ได้เป็นเจ้าของสูตรนี้" });
    }

    req.recipe = recipe; // store recipe for next middleware
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
}

router.delete('/recipe/:id', requireOwner, async (req, res) => {
  const recipe = req.recipe; // already fetched
  const id = recipe.RecipeID;

  try {
    // Delete main image
    if (recipe.ImageURL) await deleteImage(recipe.ImageURL);

    const instructions = await Instruction.findAll({ where: { RecipeID: id } });

    for (const instruction of instructions) {
      const instructionImages = await InstructionImg.findAll({ where: { instructionID: instruction.instructionID } });
      for (const img of instructionImages) {
        if (img.imageURL) await deleteImage(img.imageURL);
        await img.destroy();
      }
      await instruction.destroy();
    }

    // Delete related records
    await Promise.all([
      Comment.destroy({ where: { RecipeID: id } }),
      Favorite.destroy({ where: { RecipeID: id } }),
      Like.destroy({ where: { RecipeID: id } }),
      Ingredient.destroy({ where: { RecipeID: id } }),
      RecipeCategory.destroy({ where: { RecipeID: id } }),
      RecipeView.destroy({ where: { RecipeID: id } })
    ]);

    await recipe.destroy();
    res.json({ message: 'Recipe and its images deleted successfully' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get("/alarm/count", async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });

  const userId = req.session.user.id;

  try {
    const user = await User.findByPk(userId);
    const lastView = user.last_alarm_view || new Date(0);

    const [likesCount, favoritesCount, commentsCount, adminAlarmsCount] = await Promise.all([
      Like.count({
        include: { model: Recipe, where: { UserID: userId } },
        where: { UserID: { [Op.ne]: userId }, CreatedAt: { [Op.gt]: lastView } }
      }),
      Favorite.count({
        include: { model: Recipe, where: { UserID: userId } },
        where: { UserID: { [Op.ne]: userId }, CreatedAt: { [Op.gt]: lastView } }
      }),
      Comment.count({
        include: { model: Recipe, where: { UserID: userId } },
        where: { UserID: { [Op.ne]: userId }, CreatedAt: { [Op.gt]: lastView } }
      }),
      Report.count({
        where: { reported_id: userId, reported_type: { [Op.like]: "alarm%" }, created_on: { [Op.gt]: lastView } },
      })
    ]);

    res.json({ count: likesCount + favoritesCount + commentsCount + adminAlarmsCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



router.get("/alarm", async (req, res) => {
  if (!req.session?.user)
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });

  const userId = req.session.user.id;

  try {
    const user = await User.findByPk(userId);
    const lastView = user.last_alarm_view || new Date(0);

    // Run queries in parallel
    const [likes, favorites, comments, adminAlarms] = await Promise.all([
      Like.findAll({
        include: [
          { model: Recipe, where: { UserID: userId }, attributes: ['Title', 'ImageURL'] },
          { model: User, attributes: ['username'] }
        ],
        where: { UserID: { [Op.ne]: userId } }
      }),
      Favorite.findAll({
        include: [
          { model: Recipe, where: { UserID: userId }, attributes: ['Title', 'ImageURL'] },
          { model: User, attributes: ['username'] }
        ],
        where: { UserID: { [Op.ne]: userId } }
      }),
      Comment.findAll({
        include: [
          { model: Recipe, where: { UserID: userId }, attributes: ['Title', 'ImageURL'] },
          { model: User, attributes: ['username'] }
        ],
        where: { UserID: { [Op.ne]: userId }, type: 'normal' }
      }),
      Report.findAll({
        where: { reported_id: userId, reported_type: { [Op.like]: "alarm%" } },
      }),
    ]);

    // --- Extract RecipeIDs from alarm reports ---
    const recipeIds = adminAlarms
      .map(a => {
        // console.dir(a)
        if (a.reported_type.includes(",")) {
          const parts = a.reported_type.split(",");
          return parts[1] && !isNaN(parts[1]) ? parseInt(parts[1], 10) : null;
        }
        return null;
      })
      .filter(id => id !== null);

    // Fetch all recipes in one go
    const recipes = await Recipe.findAll({
      where: { RecipeID: recipeIds },
      attributes: ["RecipeID", "Title", "ImageURL"],
    });
    const recipeMap = Object.fromEntries(recipes.map(r => [r.RecipeID, r]));

    // Map all notifications into a single array
    const alarms = [
      ...likes.map(l => ({
        type: 'like',
        actorUsername: l.User.username,
        RecipeID: l.RecipeID,
        recipeTitle: l.Recipe?.Title || null,
        recipeImage: l.Recipe?.ImageURL || null,
        Content: null,
        CreatedAt: l.CreatedAt,
        isRead: l.CreatedAt <= lastView
      })),
      ...favorites.map(f => ({
        type: 'favorite',
        actorUsername: f.User.username,
        RecipeID: f.RecipeID,
        recipeTitle: f.Recipe?.Title || null,
        recipeImage: f.Recipe?.ImageURL || null,
        Content: null,
        CreatedAt: f.CreatedAt,
        isRead: f.CreatedAt <= lastView
      })),
      ...comments.map(c => ({
        type: 'comment',
        actorUsername: c.User.username,
        RecipeID: c.RecipeID,
        recipeTitle: c.Recipe?.Title || null,
        recipeImage: c.Recipe?.ImageURL || null,
        Content: null,
        CreatedAt: c.CreatedAt,
        isRead: c.CreatedAt <= lastView
      })),
      ...adminAlarms.map(a => {
        let parsedRecipeId = null;
        if (a.reported_type.includes(",")) {
          const parts = a.reported_type.split(",");
          parsedRecipeId = parts[1] && !isNaN(parts[1]) ? parseInt(parts[1], 10) : null;
        }

        const recipe = parsedRecipeId ? recipeMap[parsedRecipeId] : null;

        return {
          type: "alarm",
          actorUsername: "Admin",
          RecipeID: parsedRecipeId,
          recipeTitle: recipe?.Title || null,
          recipeImage: recipe?.ImageURL || null,
          CreatedAt: a.created_on,
          Content: a.reason,
          isRead: a.created_on <= lastView,
        };
      }),
    ];

    // Sort newest first
    alarms.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

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



router.post("/:id/report", upload.array("images"), async (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  const reporterId = req.session.user.id;
  const { reason, reported_id, type } = req.body;

  try {
    const report = await Report.create({
      Reporter_id: reporterId,
      reason,
      reported_type: type,
      reported_id,
      status: 'pending',
      created_on: new Date()
    });
    const ReportID = report.ReportID;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadImage(file.buffer, {
          folder: `image_project/report_image/report_${reported_id}`
        });

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

router.patch('/report/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // action = 'delete' | 'resolved'

  try {
    const report = await Report.findByPk(id, {
      include: [{ model: ReportEvidence }]
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    if (action === 'delete') {
      // Delete all associated images from Cloudinary
      for (const evidence of report.ReportEvidences) {
        await deleteImage(evidence.file_url);
        await evidence.destroy();
      }
      await report.destroy();
      return res.json({ message: 'ลบรายงานแล้ว' });
    }

    if (action === 'resolved') {
      report.status = 'resolved'; // or 'resolved', whatever you use
      await report.save();
      return res.json({ message: 'รายงานนี้ดำเนินการสำเร็จ', report });
    }

    res.status(400).json({ error: 'Invalid action. Use "delete" or "finish".' });
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


function requireAdmin(req, res, next) {
  if (!req.session?.user)
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อน" });
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });
  }
  next();
}



/*get dashboard data*/
router.get("/admin/data", requireAdmin, async (req, res) => {
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
    const adminId = req.session.user.id;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'ban') {
      const addBanDay = Number(days);
      if (!addBanDay || isNaN(addBanDay) || addBanDay < 1) {
        return res.status(400).json({ error: 'Invalid number of days' });
      }
      user.status = 'banned';
      // Set stat_update to the unban date
      const unbanDate = new Date();
      unbanDate.setDate(unbanDate.getDate() + addBanDay);
      user.stat_update = unbanDate;
      const message = `คุณถูกระงับการใช้งาน ${unbanDate.toLocaleDateString()}`;
      await sendAlarmRequest(user.id, message, null, adminId);

    } else if (action === 'unban') {
      user.status = 'normal';
      user.stat_update = new Date(); // now
      const message = 'การระงับการใช้งานถูกปลดแล้ว';
      await sendAlarmRequest(user.id, message, null, adminId);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await user.save();
    res.json({ message: `ผู้ใช้งาน${user.username}${action == 'unban' ? 'ยกเลิกระงับการใช้งาน' : 'ระงับการใช้งาน'}สำเร็จ`, user });
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

    await Favorite.destroy({ where: { UserID: id } });
    await Like.destroy({ where: { UserID: id } });

    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'ผู้ใช้งานนี้ถูกลบแล้ว' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/*sent alarm to user */
router.post('/admin/user/:id/alarm', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { recipeId, message } = req.body;
  const adminId = req.session.user.id;
  try {
    const alarm = await sendAlarmRequest(id, message, recipeId, adminId);

    res.json({ message: 'ส่งคำเตือนสำเร็จ', alarm });
  } catch (err) {
    console.error('Error sending alarm:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/*set user role */
router.patch('/admin/user/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const adminId = req.session.user.id;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const oldRole = user.role;
    user.role = role;
    await user.save();

    const message = `Role ของคุณถูกเปลี่ยนจาก "${oldRole}" เป็น "${role}"`;
    await sendAlarmRequest(user.id, message, null, adminId);

    res.json({ message: `Role ของผู้ใช้งานเปลี่ยนเป็น ${role}`, user });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/*get recipe data */
router.get('/admin/recipe', requireAdmin, async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      attributes: ['RecipeID', 'Title', 'CreatedAt', 'UpdatedAt', 'UserID'],
      include: [{ model: User, attributes: ['username'] }]
    });
    // console.log(recipes);
    res.json(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/admin/recipe/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.session.user.id;
  try {
    // Find the recipe first
    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    // Delete main image from Cloudinary
    if (recipe.ImageURL) {
      await deleteImage(recipe.ImageURL);
    }

    const instructions = await Instruction.findAll({ where: { RecipeID: id } });

    for (const instruction of instructions) {
      const instructionImages = await InstructionImg.findAll({ where: { instructionID: instruction.instructionID } });
      for (const img of instructionImages) {
        if (img.imageURL) await deleteImage(img.imageURL);
        await img.destroy();
      }
      await instruction.destroy();
    }


    // Delete related records
    await Comment.destroy({ where: { RecipeID: id } });
    await Favorite.destroy({ where: { RecipeID: id } });
    await Like.destroy({ where: { RecipeID: id } });
    await Ingredient.destroy({ where: { RecipeID: id } });
    await Instruction.destroy({ where: { RecipeID: id } });
    await RecipeCategory.destroy({ where: { RecipeID: id } });
    await RecipeView.destroy({ where: { RecipeID: id } });



    const alarmMessage = `เมนู "${recipe.Title}" ถูกลบแล้ว`;
    await sendAlarmRequest(recipe.UserID, alarmMessage, null, adminId);

    // Finally, delete the recipe
    await recipe.destroy();
    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/*get comment data */
router.get('/admin/comment', requireAdmin, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      attributes: ['CommentID', 'Content', 'CreatedAt', 'UserID', 'RecipeID', 'type', 'ParentCommentID'],
      include: [
        { model: User, attributes: ['id', 'username'] },

      ]
    });

    // Build a map of comments by ID for quick parent lookup
    const commentsMap = new Map();
    comments.forEach(c => {
      commentsMap.set(c.CommentID, c);
    });

    // Build response
    const commentsList = comments
      // .filter(c => c.type !== 'alarm') // skip alarms in admin list
      .map(c => {
        return {
          id: c.CommentID,
          content: c.Content,
          type: c.type,
          createdAt: c.CreatedAt,
          user: { id: c.User.id, username: c.User.username },
          parrentContent: c.ParentCommentID ? (commentsMap.get(c.ParentCommentID)?.Content || '') : '',
        };
      });

    // console.log(commentsList);
    res.json(commentsList);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/admin/comment/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { isAddedRequest } = req.body;
  const adminId = req.session.user.id;
  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Handle replies: detach or delete them
    await Comment.update(
      { ParentCommentID: null },
      { where: { ParentCommentID: id } }
    );
    console.log(isAddedRequest);
    console.log(adminId);
    console.log(comment.UserID);
    console.log(comment.UserID !== adminId);
    // Send alarm before deletion
    const alarmMessage = `Your comment "${comment.Content}" has been deleted by admin.`;
    if (!isAddedRequest //don't send alarm if already sent from report handling
      && comment.UserID !== adminId  //if admin delete his own comment, don't send alarm
    ) {
      await sendAlarmRequest(comment.UserID, alarmMessage, null, adminId);
    }

    await comment.destroy();
    res.json({ message: 'ลบความคิดเห็นสำเร็จ' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/admin/comment/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    comment.Content = content;
    await comment.save();
    res.json({ message: 'แก้ไขความคิดเห็นสำเร็จ', comment });
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const typeHandlers = {
  user: async (id) => {
    const detail = await User.findByPk(id, { attributes: ['id', 'username', 'email'] });
    return { detail, report_name: detail?.username || 'Deleted User' };
  },
  recipe: async (id) => {
    const detail = await Recipe.findByPk(id, {
      attributes: ['RecipeID', 'Title', 'ImageURL', 'videoURL'],
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Category, attributes: ['CategoryID', 'name'] },
        { model: Ingredient, include: [DataIngredient] },
        { model: Instruction, include: [InstructionImg] },
        { model: Comment, include: [User] }
      ]
    });
    return { detail, report_name: detail?.Title || 'Deleted Recipe' };
  },
  ingredient: async (id) => {
    const detail = await Ingredient.findByPk(id, {
      include: [
        DataIngredient,
        { model: Recipe, attributes: ['RecipeID', 'Title'] }
      ]
    });

    const ingredientName = detail?.DataIngredient?.name_th || 'Deleted Ingredient';
    const recipeTitle = detail?.Recipe?.Title || 'Deleted Recipe';
    const report_name = `${ingredientName} of ${recipeTitle}`;

    return { detail, report_name };
  },

  instruction: async (id) => {
    const detail = await Instruction.findByPk(id, {
      include: [
        { model: InstructionImg },
        { model: Recipe, attributes: ['RecipeID', 'Title'] }
      ]
    });

    const instructionText = detail?.details || 'Deleted Instruction';
    const recipeTitle = detail?.Recipe?.Title || 'Deleted Recipe';
    const report_name = `${instructionText} of ${recipeTitle}`;

    return { detail, report_name };
  },

  instruction_image: async (id) => {
    const detail = await Instruction.findByPk(id, {
      include: [
        { model: InstructionImg },
        { model: Recipe, attributes: ['RecipeID', 'Title'] }
      ]
    });

    const recipeTitle = detail?.Recipe?.Title || 'Deleted Recipe';
    const report_name = `Instruction Image of ${recipeTitle}`;

    return { detail, report_name };
  },

  recipe_image: async (id) => {
    const detail = await Recipe.findByPk(id, { attributes: ['RecipeID', 'Title', 'ImageURL'] });
    const report_name = `recipe Image of ${detail?.Title}` || 'Deleted Recipe';
    return { detail, report_name };
  },
  category: async (id) => {
    const detail = await Category.findByPk(id, {
      include: [{ model: Recipe, attributes: ['RecipeID', 'Title'] }]
    });
    const categoryName = detail?.name || 'Deleted Category';
    const recipeTitle = detail?.Recipe?.Title || 'Unknown Recipe';
    const report_name = `${categoryName} of ${recipeTitle}`;
    return { detail, report_name };
  },

  video: async (id) => {
    const detail = await Recipe.findByPk(id, { attributes: ['RecipeID', 'Title', 'videoURL'] });
    const report_name = detail ? `Video of ${detail.Title}` : 'Deleted Recipe Video';
    return { detail, report_name };
  },

  comment: async (id) => {
    const detail = await Comment.findByPk(id, { include: [User, Recipe] });
    const recipeTitle = detail?.Recipe?.Title || 'Deleted Recipe';
    const report_name = `Comment of User:${detail?.User?.username} in ${recipeTitle}`;
    return { detail, report_name };
  },
  alarm: async (id, report) => {
    const recipeId = report.reported_type.split(',')[1];
    const alarmRecipe = recipeId
      ? await Recipe.findByPk(recipeId, { attributes: ['Title'] })
      : null;
    const reportedUser = !recipeId && report.reported_id
      ? await User.findByPk(report.reported_id, { attributes: ['username'] })
      : null;

    const detail = { type: 'alarm', text: report.reason, recipe: alarmRecipe };
    const report_name = alarmRecipe?.Title
      ? `Recipe: ${alarmRecipe.Title}`
      : recipeId
        ? 'Deleted Recipe'
        : `User: ${reportedUser?.username || 'Deleted User'}`;
    return { detail, report_name };
  },
  other: async (id, report) => {
    return { detail: { info: report.reason }, report_name: report.reason || 'Other' };
  }
};

// get report data
router.get('/admin/report', requireAdmin, async (_, res) => {
  try {
    const reports = await Report.findAll({
      attributes: [
        'ReportID',
        'Reporter_id',
        'reported_type',
        'reported_id',
        'reason',
        'status',
        'created_on'
      ],
      include: [
        { model: User, attributes: ['id', 'username'] }, // Reporter
        {
          model: ReportEvidence,
          attributes: ['EvidenceID', 'file_url', 'file_type', 'created_on']
        }
      ]
    });

    const result = await Promise.all(
      reports.map(async (r) => {
        let detail = null;
        let report_name = null;

        switch (r.reported_type) {
          case 'user':
            detail = await User.findByPk(r.reported_id, {
              attributes: ['id', 'username', 'email']
            });
            report_name = detail ? detail.username : null;
            break;

          case 'recipe':
            detail = await Recipe.findByPk(r.reported_id, {
              attributes: ['RecipeID', 'Title', 'ImageURL', 'videoURL'],
              include: [
                { model: User, attributes: ['id', 'username'] },
                { model: Category, attributes: ['CategoryID', 'name'] },
                { model: Ingredient, include: [DataIngredient] },
                { model: Instruction, include: [InstructionImg] },
                { model: Comment, include: [User] }
              ]
            });
            report_name = detail ? detail.Title : null;
            break;

          case 'ingredient':
            detail = await Ingredient.findByPk(r.reported_id, {
              include: [DataIngredient, Recipe]
            });
            console.dir(detail)
            report_name = detail?.DataIngredient?.name_th || `Deleted Recipe or Ingredient`;
            break;


          case 'instruction':
          case 'instruction_image':
            detail = await Instruction.findByPk(r.reported_id, {
              include: [InstructionImg, Recipe]
            });
            report_name = detail?.details || `Deleted Recipe or Instruction`;
            break;

          case 'video':
            detail = await Recipe.findByPk(r.reported_id, {
              attributes: ['RecipeID', 'Title', 'videoURL']
            });
            report_name = detail ? detail.Title : null;
            break;

          case 'comment':
            detail = await Comment.findByPk(r.reported_id, { include: [User, Recipe] });
            report_name = detail ? detail.Content : null; // adjust field name if not "content"
            break;

          case 'alarm':
          case (r.reported_type?.startsWith('alarm') && r.reported_type):
            const recipeId = r.reported_type.split(',')[1]; // optional recipe ID
            let alarmRecipe = recipeId
              ? await Recipe.findByPk(recipeId, { attributes: ['Title'] })
              : null;

            let reportedUser = !recipeId && r.reported_id
              ? await User.findByPk(r.reported_id, { attributes: ['username'] })
              : null;
            detail = {
              type: 'alarm',
              text: r.reason,
              recipe: alarmRecipe,
            };

            report_name = alarmRecipe?.Title
              ? `Recipe: ${alarmRecipe.Title}`
              : recipeId
                ? 'Deleted Recipe'
                : `User: ${reportedUser?.username || 'Delected User'}`;
            break;

          default:
            detail = { info: r.reason };
            report_name = r.reason;
        }

        return {
          ReportID: r.ReportID,
          Reporter_id: r.Reporter_id,
          Reporter_name: r.User?.username || 'Unknown',
          reported_type: r.reported_type,
          reported_id: r.reported_id,
          reported_name: report_name,
          reason: r.reason,
          status: r.status || '',
          created_on: r.created_on,
          evidences: r.ReportEvidences.map((e) => ({
            EvidenceID: e.EvidenceID,
            file_url: e.file_url,
            file_type: e.file_type,
            created_on: e.created_on
          })),
          detail,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// ===== AUTH CHECK =====
// GET /api/users/me
router.get('/me', (req, res) => {
  if (req.session?.user) return res.json({ user: req.session.user });
  res.status(401).json({ user: null });
});


module.exports = router;
