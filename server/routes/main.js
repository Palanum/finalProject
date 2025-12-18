const express = require('express');
const router = express.Router();

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
  User
} = require('../models');

const sequelize = require('../db'); // ✅ correct
const { Op } = require('sequelize');

router.get('/home', async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Category, through: { attributes: [] }, attributes: ['Name'] } // many-to-many
      ],
      order: [['RecipeID', 'DESC']],
      limit: 12
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


module.exports = router;
