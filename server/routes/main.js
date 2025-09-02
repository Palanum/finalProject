const express = require('express');
const router = express.Router();

const { Recipe, User, Category } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../db'); // ✅ correct

router.get('/home', async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Category, through: { attributes: [] }, attributes: ['Name'] } // many-to-many
      ],
      order: [['RecipeID', 'DESC']],
      limit: 10
    });

    const formattedRecipes = recipes.map(r => ({
      RecipeID: r.RecipeID,
      Title: r.Title,
      ImageURL: r.ImageURL,
      time: r.time,
      categories: r.Categories.map(c => c.Name),
      user: {
        id: r.User.id,
        username: r.User.username
      }
    }));

    // console.log('Recipes fetched:', formattedRecipes);
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
