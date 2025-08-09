const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY;

async function translateThaiToEnglish(text) {
  try {
    const url = 'https://translate.googleapis.com/translate_a/single';
    const params = {
      client: 'gtx',
      sl: 'th',
      tl: 'en',
      dt: 't',
      q: text,
    };
    const response = await axios.get(url, { params });
    return response.data[0][0][0];
  } catch (err) {
    console.error('Free Google Translate error:', err.message);
    return null;
  }
}

async function searchUsdaByName(engName) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`;
  try {
    const response = await axios.post(url, {
      query: engName,
      pageSize: 5,
      dataType: ['Foundation', 'Branded', 'Survey (FNDDS)'],
      requireAllWords: true,
    });
    return response.data.foods || [];
  } catch (err) {
    console.error('USDA API search error:', err.message);
    return [];
  }
}

function extractNutrition(food) {
  const nutrientIds = {
    calories: 1008,
    protein: 1003,
    fat: 1004,
    carbs: 1005,
  };

  const nutrition = {
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
  };

  if (!food.foodNutrients) return nutrition;

  for (const nut of food.foodNutrients) {
    switch (nut.nutrientId) {
      case nutrientIds.calories:
        nutrition.calories = nut.value || null;
        break;
      case nutrientIds.protein:
        nutrition.protein = nut.value || null;
        break;
      case nutrientIds.fat:
        nutrition.fat = nut.value || null;
        break;
      case nutrientIds.carbs:
        nutrition.carbs = nut.value || null;
        break;
    }
  }
  return nutrition;
}

async function searchIngredient(thaiName) {
  // Step 1: Translate Thai -> English
  const engName = await translateThaiToEnglish(thaiName);
  console.log(`Translated: ${thaiName} -> ${engName}`);

  if (!engName) {
    console.log('Translation failed, cannot search.');
    return [];
  }

  try {
    const foods = await searchUsdaByName(engName);
    if (!foods.length) {
      console.log('No USDA data found.');
      return [];
    }

    const firstFood = foods[0];
    console.log('Full data of first result:');
    console.dir(firstFood, { depth: 10, colors: true });

    const nutrition = extractNutrition(firstFood);
    console.log('Extracted Nutrition Info:', nutrition);

    return { food: firstFood, nutrition };

  } catch (err) {
    console.error('USDA API error:', err.message);
    return [];
  }
}

// Your findOrCreateIngredient function using the helpers
async function findOrCreateIngredient(conn, thaiName) {
  const engName = await translateThaiToEnglish(thaiName);
  if (!engName) throw new Error('Translation failed');

  const usdaFoods = await searchUsdaByName(engName);
  if (!usdaFoods || usdaFoods.length === 0) throw new Error('No USDA data found');

  const firstFood = usdaFoods[0];
  const externalId = firstFood.fdcId.toString();

  // Check local DB by external_id
  const [found] = await conn.query(
    `SELECT RawIngredientID FROM data_ingredients WHERE external_id = ?`,
    [externalId]
  );
  if (found.length > 0) return found[0].RawIngredientID;

  const nutrition = extractNutrition(firstFood);

  // Insert new ingredient locally
  const [insert] = await conn.query(
    `INSERT INTO data_ingredients 
      (name_eng, name_th, calories, protein, fat, carbs, external_id, source, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'USDA', 0)`,
    [
      engName,
      thaiName,
      nutrition.calories,
      nutrition.protein,
      nutrition.fat,
      nutrition.carbs,
      externalId
    ]
  );
  return insert.insertId;
}



router.post('/addnew', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { title, CategoryID, videoURL, ingredients, instructions } = req.body;

    await conn.beginTransaction();

    // 1. Insert recipe
    const [recipeResult] = await conn.query(
      'INSERT INTO recipes (Title, CategoryID, videoURL) VALUES (?, ?, ?)',
      [title, CategoryID, videoURL]
    );
    const RecipeID = recipeResult.insertId;

    // 2. Insert ingredients with lookup
    // In your addnew route:
    for (const ing of ingredients) {
      const rawIngredientId = await findOrCreateIngredient(conn, ing.name); // ing.name = Thai name
      await conn.query(
        'INSERT INTO ingredients (RecipeID, RawIngredientID, Quantity, Unit) VALUES (?, ?, ?, ?)',
        [RecipeID, rawIngredientId, ing.amount, ing.unit]
      );
    }


    // 3. Insert instructions
    for (const [idx, step] of instructions.entries()) {
      const [insRes] = await conn.query(
        'INSERT INTO intruction (RecipeID, details) VALUES (?, ?)',
        [RecipeID, step.text]
      );
      const instructionId = insRes.insertId;

      if (step.imageURL) {
        await conn.query(
          'INSERT INTO instruction_img (instructionID, imageURL) VALUES (?, ?)',
          [instructionId, step.imageURL]
        );
      }
    }

    await conn.commit();
    res.json({ msg: 'Recipe added', RecipeID });

  } catch (error) {
    await conn.rollback();
    console.error('Error adding recipe:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
});


router.post('/', (req, res) => {
  try {
    const { RecipeID } = req.body;
    res.json({ msg: 'Get recipe', recipe: { RecipeID } });
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
