const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

router.get('/home', async (req, res) => {
  try {
    const [recipes] = await pool.query(`
      SELECT r.RecipeID, r.Title, r.ImageURL, r.time, r.UserID,
             u.username,
             GROUP_CONCAT(c.Name) AS categories
      FROM recipes r
      LEFT JOIN users u ON r.UserID = u.id
      LEFT JOIN recipe_category rc ON r.RecipeID = rc.RecipeID
      LEFT JOIN categories c ON rc.CategoryID = c.CategoryID
      GROUP BY r.RecipeID
      ORDER BY r.RecipeID DESC
      LIMIT 10
    `);

    // Format response
    const formattedRecipes = recipes.map(r => ({
      RecipeID: r.RecipeID,
      Title: r.Title,
      ImageURL: r.ImageURL,
      time: r.time,
      categories: r.categories ? r.categories.split(',') : [],
      user: {
        id: r.UserID,
        username: r.username
      }
    }));
    // console.log('Formatted recipes:', formattedRecipes);
    res.json(formattedRecipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/message', (req, res) => {
  res.json({ msg: 'this is message for API route ,HAHA!' });
});
router.get('/health', (req, res) => {
  res.json({ status: 'OK', msg: 'this is message for health route ,HAHA!' });
});

module.exports = router;
