const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

const USDA_API_KEY = process.env.USDA_API_KEY;
const ingredientData = {
  "ข้าวเหนียว": { eng: "sticky rice", synonyms: ["glutinous rice", "sweet rice", "mochi rice"] },
  "ข้าวกล้อง": { eng: "brown rice", synonyms: ["whole grain rice"] },
  "ข้าวโพด": { eng: "corn", synonyms: ["maize", "sweet corn", "corn kernel"] },
  "ข้าวโอ๊ต": { eng: "oats", synonyms: ["rolled oats", "oatmeal"] },
  "ข้าวบาร์เลย์": { eng: "barley", synonyms: ["hulled barley"] },
  "แป้งข้าวเจ้า": { eng: "rice flour", synonyms: ["white rice flour"] },
  "แป้งข้าวเหนียว": { eng: "glutinous rice flour", synonyms: ["sticky rice flour", "mochi flour"] },
  "แป้งสาลี": { eng: "wheat flour", synonyms: ["all-purpose flour", "plain flour"] },
  "แป้งมันสำปะหลัง": { eng: "tapioca flour", synonyms: ["cassava flour"] },
  "แป้งข้าวโพด": { eng: "corn flour", synonyms: ["cornstarch"] },
  "ปีกบน": { eng: "chicken wing", synonyms: ["wing"] },
  "อกไก่": { eng: "chicken breast", synonyms: ["breast"] },
  "สะโพกไก่": { eng: "chicken thigh", synonyms: ["thigh"] },
  "สันคอหมู": { eng: "pork collar", synonyms: ["pork neck"] },
  "สันในหมู": { eng: "pork loin", synonyms: ["pork tenderloin"] },
  "กุ้งแชบ๊วย": { eng: "white shrimp", synonyms: ["white prawn", "vannamei"] },
  "กุ้งก้ามกราม": { eng: "giant freshwater prawn", synonyms: ["river prawn", "Macrobrachium rosenbergii"] },
  "ปูม้า": { eng: "blue crab", synonyms: ["sea crab", "swimming crab"] },
  "หอยนางรม": { eng: "oyster", synonyms: ["shell oyster"] },
  "ปลาดุก": { eng: "catfish", synonyms: ["mudfish"] },
  "ปลาทู": { eng: "mackerel", synonyms: ["short mackerel"] },
  "ปลานิล": { eng: "tilapia", synonyms: ["Nile tilapia"] },
  "ปลากะพง": { eng: "sea bass", synonyms: ["barramundi", "Lates calcarifer"] },
  "ปลาทูน่า": { eng: "tuna", synonyms: ["skipjack tuna", "Thunnus"] },
  "ผักกาดขาว": { eng: "chinese cabbage", synonyms: ["napa cabbage", "wong bok", "Brassica rapa subsp. pekinensis"] },
  "ผักกาดหอม": { eng: "lettuce", synonyms: ["romaine", "butter lettuce"] },
  "ผักบุ้ง": { eng: "morning glory", synonyms: ["water spinach", "kangkung", "Ipomoea aquatica"] },
  "ผักโขม": { eng: "spinach", synonyms: ["baby spinach", "Spinacia oleracea"] },
  "ผักชี": { eng: "coriander", synonyms: ["cilantro", "chinese parsley", "Coriandrum sativum"] },
  "ผักชีฝรั่ง": { eng: "parsley", synonyms: ["flat-leaf parsley", "Petroselinum crispum"] },
  "คะน้า": { eng: "chinese kale", synonyms: ["gai lan", "kai-lan", "Brassica oleracea var. alboglabra"] },
  "ตะไคร้": { eng: "lemongrass", synonyms: ["lemon grass", "Cymbopogon citratus"] },
  "ข่า": { eng: "galangal", synonyms: ["Thai ginger", "blue ginger", "Alpinia galanga"] },
  "ใบมะกรูด": { eng: "kaffir lime leaf", synonyms: ["makrut lime leaf", "Citrus hystrix"] },
  "มะเขือเทศ": { eng: "tomato", synonyms: ["roma tomato", "cherry tomato", "Solanum lycopersicum"] },
  "มะเขือเปราะ": { eng: "thai eggplant", synonyms: ["green eggplant", "Solanum melongena var. esculentum"] },
  "มะเขือม่วง": { eng: "eggplant", synonyms: ["aubergine", "brinjal", "Solanum melongena"] },
  "มะเขือยาว": { eng: "long eggplant", synonyms: ["Japanese eggplant"] },
  "แตงกวา": { eng: "cucumber", synonyms: ["garden cucumber", "Cucumis sativus"] },
  "แตงโม": { eng: "watermelon", synonyms: ["seedless watermelon", "Citrullus lanatus"] },
  "ฟักทอง": { eng: "pumpkin", synonyms: ["winter squash", "Cucurbita pepo"] },
  "แครอท": { eng: "carrot", synonyms: ["baby carrot", "orange carrot", "Daucus carota"] },
  "หัวหอม": { eng: "onion", synonyms: ["yellow onion", "white onion", "Allium cepa"] },
  "หอมแดง": { eng: "shallot", synonyms: ["red shallot", "Allium ascalonicum"] },
  "กระเทียม": { eng: "garlic", synonyms: ["clove", "garlic clove", "Allium sativum"] },
  "ขิง": { eng: "ginger", synonyms: ["fresh ginger", "root ginger", "Zingiber officinale"] },
  "ผักกวางตุ้ง": { eng: "choy sum", synonyms: ["cai xin", "flowering cabbage"] },
  "รากผักชี": { eng: "cilantro root", synonyms: ["coriander root"] },
  "พริกไทย": { eng: "black pepper", synonyms: ["peppercorn"] },
  "ฟัก": { eng: "winter melon", synonyms: ["waxgourd", "Benincasa hispida"] },
  "ฟักอ่อน": { eng: "young winter melon", synonyms: ["waxgourd", "chinese preserving melon"] },
  "มะระ": { eng: "bitter melon", synonyms: ["balsam-pear", "bitter gourd", "momordica charantia"] },

  // General fallback categories
  "ไก่": { eng: "chicken", synonyms: ["breast", "thigh", "wing", "drumstick"] },
  "หมู": { eng: "pork", synonyms: ["loin", "belly", "shoulder", "ham"] },
  "วัว": { eng: "beef", synonyms: ["sirloin", "chuck", "brisket", "ribeye", "round"] },
  "เนื้อ": { eng: "beef", synonyms: ["sirloin", "chuck", "brisket", "ribeye", "round"] },
  "เป็ด": { eng: "duck", synonyms: ["breast", "thigh"] },
  "แกะ": { eng: "lamb", synonyms: [] },
  "แพะ": { eng: "goat", synonyms: [] },
  "กวาง": { eng: "venison", synonyms: [] },
  "กระต่าย": { eng: "rabbit", synonyms: [] },
  "ไก่งวง": { eng: "turkey", synonyms: ["breast", "thigh", "wing"] },
  "ไข่": { eng: "egg", synonyms: ["eggs"] },
  "ปลา": { eng: "fish", synonyms: ["fillet", "whole", "steak"] },
  "กุ้ง": { eng: "shrimp", synonyms: ["whole", "peeled"] },
  "ปู": { eng: "crab", synonyms: ["crab meat"] },
  "หอย": { eng: "shellfish", synonyms: ["mollusk"] },
  "ปลาหมึก": { eng: "squid", synonyms: ["calamari"] },
  "ข้าว": { eng: "rice", synonyms: ["cooked rice", "white rice"] },
  "แป้ง": { eng: "flour", synonyms: ["all-purpose flour"] },
  "ถั่ว": { eng: "bean", synonyms: ["legume"] },
  "ผัก": { eng: "vegetable", synonyms: ["greens"] },
  "ผลไม้": { eng: "fruit", synonyms: ["fruits"] },
  "น้ำมัน": { eng: "oil", synonyms: ["cooking oil", "vegetable oil"] },
  "น้ำ": { eng: "water", synonyms: ["aqua"] },
  "น้ำปลา": { eng: "fish sauce", synonyms: ["nam pla"] },
  "ซอส": { eng: "sauce", synonyms: ["soy sauce"] },
  "น้ำตาล": { eng: "sugar", synonyms: ["white sugar", "brown sugar"] },
  "น้ำส้มสายชู": { eng: "vinegar", synonyms: ["white vinegar", "rice vinegar"] },
  "น้ำมะนาว": { eng: "lime juice", synonyms: ["lemon juice"] }
};



async function mapIngredient(thaiInput) {
  thaiInput = thaiInput.trim();

  // only check exact Thai names
  for (const key in ingredientData) {
    if (thaiInput.includes(key)) {
      return ingredientData[key].eng;
    }
  }

  // fallback: use translation API if no Thai match
  return await libreTranslateThaiToEng(thaiInput);
}

function chooseBestFood(rawFoods, engName) {
  const lowerName = engName.toLowerCase();

  // first try exact match with main name or any synonyms
  let match = rawFoods.find(f =>
    f.description.toLowerCase() === lowerName ||
    Object.values(ingredientData).some(data =>
      data.eng.toLowerCase() === lowerName &&
      data.synonyms.some(s => f.description.toLowerCase().includes(s.toLowerCase()))
    )
  );
  if (match) return match;

  // next: partial match with main name or synonyms
  match = rawFoods.find(f =>
    f.description.toLowerCase().includes(lowerName) ||
    Object.values(ingredientData).some(data =>
      data.eng.toLowerCase() === lowerName &&
      data.synonyms.some(s => f.description.toLowerCase().includes(s.toLowerCase()))
    )
  );
  if (match) return match;

  // then fallback to categories
  const meatCategories = ['Poultry Products', 'Beef Products', 'Pork Products', 'Seafood Products'];
  const plantCategories = ['Vegetables and Vegetable Products', 'Fruits and Fruit Juices', 'Legumes and Legume Products'];

  match = rawFoods.find(f => plantCategories.includes(f.foodCategory));
  if (match) return match;

  return rawFoods[0];
}



function extractNutrition(food) {
  const nutrientIds = { 
    calories: [1008, 2047, 2048], 
    protein: [1003], 
    fat: [1004], 
    carbs: [1005] 
  };
  const nutrition = {};
  
  if (!food.foodNutrients) return { calories: null, protein: null, fat: null, carbs: null };

  for (const key in nutrientIds) {
    const nut = food.foodNutrients.find(n => n?.nutrientId && nutrientIds[key].includes(n.nutrientId));
    nutrition[key] = nut && nut.value != null ? nut.value : null;
  }

  return nutrition;
}
function filterRawFoods(foods) {
  return foods.filter(f => {
    const text = (f.description + ' ' + (f.foodCategory || '') + ' ' + (f.commonNames || '')).toLowerCase();
    // include all foods unless explicitly cooked/fried/etc.
    return !text.match(/cooked|fried|roasted|grilled|processed|prepared/);
  });
}



async function libreTranslateThaiToEng(text) {
  const res = await axios.post(
  'http://localhost:5001/translate',
  { q: text, source: 'th', target: 'en', format: 'text' },
  { headers: { 'Content-Type': 'application/json' } }
);
return res.data.translatedText;

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



async function findOrCreateIngredient(conn, thaiName) {
  // 1️⃣ Check DB first
  const [found] = await conn.query(
    `SELECT * FROM data_ingredients WHERE name_th = ?`,
    [thaiName]
  );
  if (found.length > 0) return found[0];

  // 2️⃣ Map Thai → English using fuzzy matching
  const engName = await mapIngredient(thaiName);
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
  console.log('USDA raw foods found:');
  rawFoods.forEach(f => {
    console.log({
      fdcId: f.fdcId,
      description: f.description,
      scientificName: f.scientificName,
      foodCategory: f.foodCategory,
      calories: f.foodNutrients?.find(n => [1008].includes(n.nutrientId))?.value,
      protein: f.foodNutrients?.find(n => [1003].includes(n.nutrientId))?.value,
      fat: f.foodNutrients?.find(n => [1004].includes(n.nutrientId))?.value,
      carbs: f.foodNutrients?.find(n => [1005].includes(n.nutrientId))?.value,
    });
  });


  if (!rawFoods.length) throw new Error('No reliable raw USDA food found');

  // 5️⃣ Take first raw food
  const chosenFood = chooseBestFood(rawFoods, engName);
  const nutrition = extractNutrition(chosenFood);
  console.log(`Chosen food: ${chosenFood.description} (FDC ID: ${chosenFood.fdcId})`);

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


async function test(text) {
  try {
    const thaiName = text;

    // Use pool to query
    const ingredientData = await findOrCreateIngredient(pool, thaiName);

    console.log("Ingredient data:", ingredientData);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end(); // close pool when done
  }
}

test('มะระ');


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
