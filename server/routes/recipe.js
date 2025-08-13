const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY;
// Specific mapping for exact matches
const ingredientMap = {
  "ข้าวเหนียว": "sticky rice",
  "ข้าวกล้อง": "brown rice",
  "ข้าวโพด": "corn",
  "ข้าวโอ๊ต": "oats",
  "ข้าวบาร์เลย์": "barley",
  "แป้งข้าวเจ้า": "rice flour",
  "แป้งข้าวเหนียว": "glutinous rice flour",
  "แป้งสาลี": "wheat flour",
  "แป้งมันสำปะหลัง": "tapioca flour",
  "แป้งข้าวโพด": "corn flour",
  "ปีกบน": "chicken wing",
  "อกไก่": "chicken breast",
  "สะโพกไก่": "chicken thigh",
  "สันคอหมู": "pork collar",
  "สันในหมู": "pork loin",
  "กุ้งแชบ๊วย": "white shrimp",
  "กุ้งก้ามกราม": "giant freshwater prawn",
  "ปูม้า": "blue crab",
  "หอยนางรม": "oyster",
  "ปลาดุก": "catfish",
  "ปลาทู": "mackerel",
  "ปลานิล": "tilapia",
  "ปลากะพง": "sea bass",
  "ปลาทูน่า": "tuna",
  "ผักกาดขาว": "chinese cabbage",
  "ผักกาดหอม": "lettuce",
  "ผักบุ้ง": "morning glory",
  "ผักโขม": "spinach",
  "ผักชี": "coriander",
  "ผักชีฝรั่ง": "parsley",
  "คะน้า": "chinese kale",
  "ตะไคร้": "lemongrass",
  "ข่า": "galangal",
  "ใบมะกรูด": "kaffir lime leaf",
  "มะเขือเทศ": "tomato",
  "มะเขือเปราะ": "thai eggplant",
  "มะเขือม่วง": "eggplant",
  "มะเขือยาว": "long eggplant",
  "แตงกวา": "cucumber",
  "แตงโม": "watermelon",
  "ฟักทอง": "pumpkin",
  "แครอท": "carrot",
  "หัวหอม": "onion",
  "หอมแดง": "shallot",
  "กระเทียม": "garlic",
  "ขิง": "ginger",
  "ผักกวางตุ้ง": "choy sum",
  "รากผักชี": "cilantro root",
  "พริกไทย": "black pepper"
};

// General fallback mapping for broad categories
const generalMap = {
  "ไก่": "chicken",
  "หมู": "pork",
  "วัว": "beef",
  "เป็ด": "duck",
  "แกะ": "lamb",
  "แพะ": "goat",
  "กวาง": "venison",
  "กระต่าย": "rabbit",
  "ไก่งวง": "turkey",
  "ไข่": "egg",
  "ปลา": "fish",
  "กุ้ง": "shrimp",
  "ปู": "crab",
  "หอย": "shellfish",
  "ปลาหมึก": "squid",
  "ข้าว": "rice",
  "แป้ง": "flour",
  "ถั่ว": "bean",
  "ผัก": "vegetable",
  "ผลไม้": "fruit",
  "น้ำมัน": "oil",
  "น้ำ": "water",
  "น้ำปลา": "fish sauce",
  "ซอส": "sauce",
  "น้ำตาล": "sugar",
  "น้ำส้มสายชู": "vinegar",
  "น้ำมะนาว": "lime juice"
};


function filterRawFoods(foods) {
  return foods.filter(f => {
    const text = (f.description + ' ' + (f.foodCategory || '') + ' ' + (f.commonNames || '')).toLowerCase();
    return text.includes('raw') && !text.match(/cooked|fried|roasted|grilled|processed|prepared/);
  });
}

function extractNutrition(food) {
  const nutrientIds = { 
    calories: [1008, 2047, 2048], 
    protein: [1003], 
    fat: [1004], 
    carbs: [1005] 
  };
  const nutrition = {};
  
  for (const key in nutrientIds) {
    const nut = food.foodNutrients?.find(n => nutrientIds[key].includes(n.nutrientId));
    nutrition[key] = nut ? nut.value : null;
  }
  
  return nutrition;
}


async function searchUsdaByName(engName, strict = true) {
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`;
  try {
    const response = await axios.post(url, {
      query: `${engName} raw`,
      pageSize: 50,
      dataType: ['Foundation', 'SR Legacy'],
      requireAllWords: strict,
    });
    return response.data.foods || [];
  } catch (err) {
    console.error('USDA API error:', err.message);
    return [];
  }
}

function mapIngredient(thaiInput) {
  thaiInput = thaiInput.trim();

  // 1️⃣ Try detailed mapping first
  for (const key of Object.keys(ingredientMap)) {
    if (thaiInput.includes(key)) {
      return ingredientMap[key]; // e.g., "อกไก่" -> "chicken breast"
    }
  }

  for (const key of Object.keys(generalMap)) {
    if (thaiInput.includes(key)) {
      return generalMap[key]; // e.g., "ตีนไก่" -> "chicken"
    }
  }

  // 3️⃣ If nothing matches, return original input
  return thaiInput;
}



async function findOrCreateIngredient(conn, thaiName) {
  // 1️⃣ Check DB first
  const [found] = await conn.query(
    `SELECT * FROM data_ingredients WHERE name_th = ?`,
    [thaiName]
  );
  if (found.length > 0) return found[0];

  // 2️⃣ Map Thai → English using fuzzy matching
  const engName = mapIngredient(thaiName);
  console.log(`Mapped "${thaiName}" -> "${engName}"`);

  // 3️⃣ Search USDA strictly first
  let foods = await searchUsdaByName(engName, true);
  
  let rawFoods = filterRawFoods(foods);

  // 4️⃣ Relax search if no raw food found
  if (!rawFoods.length) {
    console.log('No raw foods found in strict search, relaxing...');
    foods = await searchUsdaByName(engName, false);
    rawFoods = filterRawFoods(foods);
  }
  console.dir(foods[0], { depth: 1, color: true });

  if (!rawFoods.length) throw new Error('No reliable raw USDA food found');

  // 5️⃣ Take first raw food
  const chosenFood = rawFoods[0];
  const nutrition = extractNutrition(chosenFood);

  // 6️⃣ Insert into DB
  const [insert] = await conn.query(
    `INSERT INTO data_ingredients 
      (name_eng, name_th, calories, protein, fat, carbs, external_id, source, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'USDA', 0)`,
    [engName, thaiName, nutrition.calories, nutrition.protein, nutrition.fat, nutrition.carbs, chosenFood.fdcId]
  );

  return {
    RawIngredientID: insert.insertId,
    name_th: thaiName,
    name_eng: engName,
    ...nutrition
  };
}


async function test() {
  try {
    const thaiName = "พริกไทย";

    // Use pool to query
    const ingredientData = await findOrCreateIngredient(pool, thaiName);

    console.log("Ingredient data:", ingredientData);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end(); // close pool when done
  }
}

test();


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
