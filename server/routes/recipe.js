const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { libreTranslateThaiToEng } = require('../config/lebretranslate');
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

// test('มะระ');


cloudinary.uploader.upload_stream_async = function (buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Please log in' });
}
async function findOrCreateCategory(conn, categoryName) {
  if (!categoryName) return null;

  const [rows] = await conn.query('SELECT CategoryID FROM categories WHERE Name = ?', [categoryName]);
  if (rows.length > 0) return rows[0].CategoryID;

  const [result] = await conn.query('INSERT INTO categories (Name) VALUES (?)', [categoryName]);
  return result.insertId;
}

router.post(
  '/addnew',
  isAuthenticated,
  upload.fields([
    { name: 'recipeImage', maxCount: 1 },
    { name: 'stepImages', maxCount: 50 },
  ]),
  async (req, res) => {
    const conn = await pool.getConnection();
    try {
      const UserID = req.session.user?.id;
      if (!UserID) return res.status(401).json({ error: 'Unauthorized: Please log in' });

      // Parse request body safely
      const {
        title,
        videoURL,
        ingredients,
        instructions,
        time,
        tags, // categories/tags
      } = req.body;

      const ingArr = ingredients ? JSON.parse(ingredients) : [];
      const stepsArr = instructions ? JSON.parse(instructions) : [];
      const tagsArr = tags ? JSON.parse(tags) : [];

      await conn.beginTransaction();

      // 1️⃣ Insert recipe WITHOUT CategoryID
      const [recipeResult] = await conn.query(
        'INSERT INTO recipes (UserID, Title, videoURL,time) VALUES (?, ?, ?,?)',
        [UserID, title, videoURL || null, time || null]
      );
      const RecipeID = recipeResult.insertId;

      // 2️⃣ Upload main recipe image
      if (req.files?.recipeImage?.[0]) {
        const uploadedRecipe = await cloudinary.uploader.upload_stream_async(
          req.files.recipeImage[0].buffer,
          { folder: `image_project/recipe_${RecipeID}` }
        );
        await conn.query(
          'UPDATE recipes SET ImageURL = ? WHERE RecipeID = ?',
          [uploadedRecipe.secure_url, RecipeID]
        );
      }


      // 3️⃣ Insert tags/categories into many-to-many table
      for (const tagName of tagsArr) {
        if (!tagName) continue;

        // Find existing category or create a new one
        const CategoryID = await findOrCreateCategory(conn, tagName);

        if (!CategoryID) continue;

        // Insert into junction table
        await conn.query(
          'INSERT INTO recipe_category (RecipeID, CategoryID) VALUES (?, ?) ON DUPLICATE KEY UPDATE RecipeID = RecipeID',
          [RecipeID, CategoryID]
        );
      }

      // 4️⃣ Insert ingredients
      for (const ing of ingArr) {
        if (!ing.name) continue;
        const ingredientObj = await findOrCreateIngredient(conn, ing.name);
        await conn.query(
          'INSERT INTO ingredients (RecipeID, RawIngredientID, Quantity, Unit) VALUES (?, ?, ?, ?)',
          [RecipeID, ingredientObj.RawIngredientID, ing.quantity || '', ing.unit || '']
        );
      }

      // 5️⃣ Insert steps & step images
      const allStepImages = req.files?.stepImages || [];
      let stepImageIndex = 0;

      for (const step of stepsArr) {
        const [insRes] = await conn.query(
          'INSERT INTO instruction (RecipeID, details) VALUES (?, ?)',
          [RecipeID, step.text || '']
        );
        const instructionId = insRes.insertId;

        const count = step.imageCount || 0;
        for (let i = 0; i < count; i++) {
          const file = allStepImages[stepImageIndex];
          if (!file) continue;

          const uploadedStepImg = await cloudinary.uploader.upload_stream_async(
            file.buffer,
            { folder: `image_project/recipe_${RecipeID}/steps` }
          );
          await conn.query(
            'INSERT INTO instruction_img (instructionID, imageURL) VALUES (?, ?)',
            [instructionId, uploadedStepImg.secure_url]
          );
          stepImageIndex++;
        }
        // console.log(`Inserted step ${instructionId} with ${count} images`);
      }

      await conn.commit();
      res.json({ msg: 'Recipe added successfully!', RecipeID });
    } catch (error) {
      await conn.rollback();
      console.error('Error adding recipe:', error.stack);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      conn.release();
    }
  }
);

// Get all recipes with tags
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.RecipeID, r.Title, r.time, r.ImageURL, u.username, t.Name
       FROM recipes r
       JOIN users u ON r.UserID = u.id
       LEFT JOIN recipe_category rt ON r.RecipeID = rt.RecipeID
       LEFT JOIN categories t ON rt.CategoryID = t.CategoryID
       ORDER BY r.RecipeID DESC`
    );

    // Group tags under each recipe
    const recipes = {};
    rows.forEach(row => {
      if (!recipes[row.RecipeID]) {
        recipes[row.RecipeID] = {
          RecipeID: row.RecipeID,
          Title: row.Title,
          time: row.time,
          ImageURL: row.ImageURL,
          username: row.username,
          categories: []
        };
      }
      if (row.Name) {
        recipes[row.RecipeID].categories.push(row.Name);
      }
    });

    res.json(Object.values(recipes));
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Search with optional filters
router.get("/search", async (req, res) => {
  const { q, category } = req.query;
  let sql = `
    SELECT r.RecipeID, r.Title, r.ImageURL, r.time, u.username, c.Name
    FROM recipes r
    JOIN users u ON r.UserID = u.id
    LEFT JOIN recipe_category rc ON r.RecipeID = rc.RecipeID
    LEFT JOIN categories c ON rc.CategoryID = c.CategoryID
    WHERE 1=1
  `;
  const params = [];

  // search by keyword
  if (q) {
    sql += " AND r.Title LIKE ?";
    params.push(`%${q}%`);
  }

  // filter by category
  if (category) {
    sql += " AND c.Name = ?";
    params.push(category);
  }

  sql += " ORDER BY r.RecipeID DESC";

  try {
    const [rows] = await pool.query(sql, params);

    // ✅ group categories per recipe
    const recipes = {};
    rows.forEach(row => {
      if (!recipes[row.RecipeID]) {
        recipes[row.RecipeID] = {
          RecipeID: row.RecipeID,
          Title: row.Title,
          ImageURL: row.ImageURL,
          time: row.time,
          username: row.username,
          categories: []
        };
      }
      if (row.Name) {
        recipes[row.RecipeID].categories.push(row.Name);
      }
    });

    res.json(Object.values(recipes));
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
const unitToGram = {
  'กิโลกรัม': 1000,
  'กรัม': 1,
  'ลิตร': 1000,    // assume density = 1 g/ml
  'มิลลิลิตร': 1,
  'ช้อนชา': 5,
  'ช้อนโต๊ะ': 15,
  'ถ้วย': 240
};
router.get('/:id', async (req, res) => {
  try {
    const userId = req.session.user?.id || 0;
    const recipeId = req.params.id;

    const [rows] = await pool.query(
      `SELECT 
         r.RecipeID, r.Title, r.time, r.ImageURL, r.videoURL,
         u.id AS UserID, u.username,
         CASE WHEN fav.UserID IS NULL THEN 0 ELSE 1 END AS isFavorite,
         CASE WHEN l.UserID IS NULL THEN 0 ELSE 1 END AS isLike,
         t.Name AS CategoryName,
         i.instructionID, i.details,
         ii.imageURL AS InstructionImage,
         ing.IngredientID, ing.Quantity, ing.Unit,
         ing_data.name_th AS IngredientName,
         ing_data.calories, ing_data.protein, ing_data.fat, ing_data.carbs
       FROM recipes r
       JOIN users u ON r.UserID = u.id
       LEFT JOIN recipe_category rt ON r.RecipeID = rt.RecipeID
       LEFT JOIN favorites fav ON r.RecipeID = fav.RecipeID AND fav.UserID = ?
       LEFT JOIN likes l ON r.RecipeID = l.RecipeID AND l.UserID = ?
       LEFT JOIN categories t ON rt.CategoryID = t.CategoryID
       LEFT JOIN instruction i ON r.RecipeID = i.RecipeID
       LEFT JOIN instruction_img ii ON i.instructionID = ii.instructionID
       LEFT JOIN ingredients ing ON r.RecipeID = ing.RecipeID
       LEFT JOIN data_ingredients ing_data ON ing.RawIngredientID = ing_data.RawIngredientID
       WHERE r.RecipeID = ?`,
      [userId, userId, recipeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    const [commentRows] = await pool.query(
      `SELECT c.CommentID, c.Content, c.type, c.CreatedAt,
              c.ParentCommentID,
              u.id AS UserID, u.username
       FROM comments c
       LEFT JOIN users u ON c.UserID = u.id
       WHERE c.RecipeID = ?
       ORDER BY c.CreatedAt ASC`,
      [recipeId]
    );
    const recipe = {
      RecipeID: rows[0].RecipeID,
      Title: rows[0].Title,
      time: rows[0].time,
      ImageURL: rows[0].ImageURL,
      videoURL: rows[0].videoURL || '',
      isFavorite: rows[0].isFavorite === 1,
      isLike: rows[0].isLike === 1,
      user: {
        id: rows[0].UserID,
        username: rows[0].username
      },
      categories: [],
      instructions: [],
      ingredients: [],
      nutrients: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      comments: []
    };
    // Build a nested comment structure
    const commentsMap = new Map();
    const commentsTree = [];
    commentRows.forEach(c => {
      const comment = {
        id: c.CommentID,
        content: c.Content,
        type: c.type,
        createdAt: c.CreatedAt,
        user: {
          id: c.UserID,
          username: c.username
        },
        replies: []
      };

      commentsMap.set(c.CommentID, comment);

      if (c.ParentCommentID) {
        // it's a reply
        const parent = commentsMap.get(c.ParentCommentID);
        if (parent) parent.replies.push(comment);
      } else {
        // top-level comment
        commentsTree.push(comment);
      }
    });

    recipe.comments = commentsTree;


    const categoriesSet = new Set();
    const instructionsMap = new Map();
    const ingredientsSet = new Set();
    const nutrientTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 };

    rows.forEach(r => {
      // Categories
      if (r.CategoryName && !categoriesSet.has(r.CategoryName)) {
        categoriesSet.add(r.CategoryName);
        recipe.categories.push(r.CategoryName);
      }

      // Instructions
      if (r.instructionID) {
        if (!instructionsMap.has(r.instructionID)) {
          instructionsMap.set(r.instructionID, {
            id: r.instructionID,
            text: r.details,
            images: new Set()
          });
        }
        if (r.InstructionImage) {
          instructionsMap.get(r.instructionID).images.add(r.InstructionImage);
        }
      }

      // Ingredients
      if (r.IngredientID && !ingredientsSet.has(r.IngredientID)) {
        ingredientsSet.add(r.IngredientID);
        recipe.ingredients.push({
          id: r.IngredientID,
          name: r.IngredientName,
          quantity: r.Quantity,
          unit: r.Unit
        });

        // Calculate nutrients (assumes r.Quantity is in grams/ml)
        const multiplier = r.Quantity / 100;
        nutrientTotals.calories += r.calories * multiplier;
        nutrientTotals.protein += r.protein * multiplier;
        nutrientTotals.fat += r.fat * multiplier;
        nutrientTotals.carbs += r.carbs * multiplier;
      }
    });

    // Finalize instructions
    recipe.instructions = Array.from(instructionsMap.values()).map(instr => ({
      id: instr.id,
      text: instr.text,
      images: Array.from(instr.images)
    }));

    // Round nutrient totals
    recipe.nutrients = {
      calories: Math.round(nutrientTotals.calories),
      protein: Math.round(nutrientTotals.protein * 10) / 10,
      fat: Math.round(nutrientTotals.fat * 10) / 10,
      carbs: Math.round(nutrientTotals.carbs * 10) / 10
    };

    res.json(recipe);
  } catch (err) {
    console.error("Error fetching recipe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/recipes/:id/comments
router.post('/:id/comments', async (req, res) => {
  const userId = req.session.user?.id;
  const recipeId = req.params.id;
  const { content, parentId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO comments (RecipeID, UserID, ParentCommentID, Content, type) VALUES (?, ?, ?, ?, 'normal')",
      [recipeId, userId, parentId || null, content]
    );

    // Return the created comment
    const [rows] = await pool.query(
      `SELECT c.CommentID, c.Content, c.type, c.CreatedAt,
              c.ParentCommentID,
              u.id AS UserID, u.username
       FROM comments c
       LEFT JOIN users u ON c.UserID = u.id
       WHERE c.CommentID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      comment: {
        id: rows[0].CommentID,
        content: rows[0].Content,
        type: rows[0].type,
        createdAt: rows[0].CreatedAt,
        user: { id: rows[0].UserID, username: rows[0].username },
        replies: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;
