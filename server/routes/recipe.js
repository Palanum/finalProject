const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { libreTranslateThaiToEng } = require('../config/lebretranslate');
const storage = multer.memoryStorage();
const upload = multer({ storage });

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



async function findOrCreateIngredient(thaiName, transaction) {
  // 1️⃣ Check DB first
  let dataIng = await DataIngredient.findOne({
    where: { name_th: thaiName },
    transaction,
  });
  if (dataIng) return dataIng;

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

  // 6️⃣ Insert into DB with Sequelize
  dataIng = await DataIngredient.create({
    name_eng: engName,
    name_th: thaiName,
    calories: nutrition.calories,
    protein: nutrition.protein,
    fat: nutrition.fat,
    carbs: nutrition.carbs,
    external_id: chosenFood.fdcId,
    source: 'USDA',
    is_verified: false,
  }, { transaction });

  return dataIng;
}



// Wrap Cloudinary upload in async
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


// async function findOrCreateCategory(conn, categoryName) {
//   if (!categoryName) return null;

//   const [rows] = await conn.query('SELECT CategoryID FROM categories WHERE Name = ?', [categoryName]);
//   if (rows.length > 0) return rows[0].CategoryID;

//   const [result] = await conn.query('INSERT INTO categories (Name) VALUES (?)', [categoryName]);
//   return result.insertId;
// }

router.post('/addnew', upload.fields([
  { name: 'recipeImage', maxCount: 1 },
  { name: 'stepImages', maxCount: 50 },
]), async (req, res) => {
  const UserID = req.session.user?.id;
  if (!UserID) return res.status(401).json({ error: 'Unauthorized: Please log in' });

  const { title, videoURL, ingredients, instructions, time, tags } = req.body;

  const ingArr = ingredients ? JSON.parse(ingredients) : [];
  const stepsArr = instructions ? JSON.parse(instructions) : [];
  const tagsArr = tags ? JSON.parse(tags) : [];

  const t = await sequelize.transaction();

  try {
    // 1️⃣ Create recipe
    const recipe = await Recipe.create({
      UserID,
      Title: title,
      videoURL: videoURL || null,
      time: time || null,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    }, { transaction: t });

    const RecipeID = recipe.RecipeID;

    // 2️⃣ Upload main image
    if (req.files?.recipeImage?.[0]) {
      const uploadedRecipe = await cloudinary.uploader.upload_stream_async(
        req.files.recipeImage[0].buffer,
        { folder: `image_project/recipe_${RecipeID}` }
      );
      recipe.ImageURL = uploadedRecipe.secure_url;
      await recipe.save({ transaction: t });
    }

    // 3️⃣ Tags / Categories
    for (const tagName of tagsArr) {
      if (!tagName) continue;
      let category = await Category.findOne({ where: { Name: tagName }, transaction: t });
      if (!category) category = await Category.create({ Name: tagName }, { transaction: t });
      await RecipeCategory.findOrCreate({
        where: { RecipeID, CategoryID: category.CategoryID },
        transaction: t
      });
    }

    // 4️⃣ Ingredients
    for (const ing of ingArr) {
      if (!ing.name) continue;

      // ✅ Use Sequelize helper (no raw conn)
      const dataIng = await findOrCreateIngredient(ing.name, t);

      await Ingredient.create({
        RecipeID,
        RawIngredientID: dataIng.RawIngredientID,
        Quantity: ing.quantity || 0,
        Unit: ing.unit || ''
      }, { transaction: t });
    }


    // 5️⃣ Steps & Step Images
    const existingSteps = await Instruction.findAll({
      where: { RecipeID },
      include: [{ model: InstructionImg }],
      order: [['instructionID', 'ASC']],
      transaction: t
    });
    // console.dir(instructions);
    for (let i = 0; i < stepsArr.length; i++) {
      const step = stepsArr[i];
      let instruction = existingSteps[i];

      instruction = await Instruction.create({ RecipeID, details: step.text || '' }, { transaction: t });
      instruction.InstructionImgs = [];

      const stepImagesFromFrontend = step.stepImages || [];

      // Upload new files
      const newFiles = stepImagesFromFrontend.filter(f => f.new && f.tempName);
      for (const file of newFiles) {
        const matchedFile = req.files?.stepImages?.find(f => f.originalname === file.tempName);
        if (!matchedFile) continue;

        const uploaded = await cloudinary.uploader.upload_stream_async(
          matchedFile.buffer,
          { folder: `image_project/recipe_${RecipeID}/steps` }
        );

        await InstructionImg.create({
          instructionID: instruction.instructionID,
          imageURL: uploaded.secure_url
        }, { transaction: t });
      }

    }


    // // 5️⃣ Steps & step images
    // let stepImageIndex = 0;
    // for (const step of stepsArr) {
    //   const instruction = await Instruction.create({
    //     RecipeID,
    //     details: step.text || ''
    //   }, { transaction: t });

    //   const stepImages = step.stepImages || [];
    //   for (const file of stepImages) {
    //     if (file.originFileObj) {
    //       const uploadedStepImg = await cloudinary.uploader.upload_stream_async(
    //         allStepImages[stepImageIndex].buffer,
    //         { folder: `image_project/recipe_${RecipeID}/steps` }
    //       );
    //       await InstructionImg.create({
    //         instructionID: instruction.instructionID,
    //         imageURL: uploadedStepImg.secure_url
    //       }, { transaction: t });
    //       stepImageIndex++;
    //     }
    //   }
    // }

    await t.commit();
    res.json({ msg: 'Recipe added successfully!', RecipeID });
  } catch (err) {
    await t.rollback();
    console.error('Error adding recipe:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get all recipes with tags
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      order: [['RecipeID', 'DESC']],
      include: [
        { model: User, attributes: ['username'] },
        { model: Category, through: { attributes: [] } } // through hides junction table
      ]
    });

    const result = recipes.map(r => ({
      RecipeID: r.RecipeID,
      Title: r.Title,
      time: r.time,
      ImageURL: r.ImageURL,
      username: r.User.username,
      categories: r.Categories.map(c => c.Name)
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Search with optional filters
router.get('/search', async (req, res) => {
  const { q, minTime, maxTime, includeIngredient } = req.query;

  try {
    const where = {};

    // Text search
    if (q) {
      const orConditions = [
        { Title: { [Op.like]: `%${q}%` } },
        { '$User.username$': { [Op.like]: `%${q}%` } },
        { '$Categories.Name$': { [Op.like]: `%${q}%` } },
      ];

      // If includeIngredient is true, also search in ingredients
      if (includeIngredient === 'true') {
        orConditions.push(
          { '$Ingredients.DataIngredient.name_eng$': { [Op.like]: `%${q}%` } },
          { '$Ingredients.DataIngredient.name_th$': { [Op.like]: `%${q}%` } }
        );
      }


      where[Op.or] = orConditions;
    }

    // Time filter
    if (minTime && maxTime) {
      where.time = { [Op.between]: [Number(minTime), Number(maxTime)] };
    } else if (minTime) {
      where.time = { [Op.gte]: Number(minTime) };
    } else if (maxTime) {
      where.time = { [Op.lte]: Number(maxTime) };
    }

    const includeModels = [
      { model: User, attributes: ['id', 'username'] },
      { model: Category, attributes: ['Name'], through: { attributes: [] } },
    ];

    // Include Ingredients if includeIngredient = true
    if (includeIngredient === 'true') {
      includeModels.push({
        model: Ingredient,
        include: [
          { model: DataIngredient, attributes: ['name_eng', 'name_th'] }
        ]
      });
    }

    const recipes = await Recipe.findAll({
      include: includeModels,
      where,
      order: [['RecipeID', 'DESC']],
      distinct: true,
    });

    const formattedRecipes = recipes.map(r => ({
      RecipeID: r.RecipeID,
      Title: r.Title,
      ImageURL: r.ImageURL,
      time: r.time,
      username: r.User?.username,
      categories: r.Categories.map(c => c.Name)
    }));

    res.json(formattedRecipes);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



const unitToGram = {
  'กิโลกรัม': 1000,
  'กรัม': 1,
  'ลิตร': 1000,
  'มิลลิลิตร': 1,
  'ช้อนชา': 5,
  'ช้อนโต๊ะ': 15,
  'ถ้วย': 240
};


router.get('/:id', async (req, res) => {
  try {
    const userId = req.session.user?.id || null;
    const recipeId = req.params.id;
    const sessionId = req.session.id; // track anonymous users

    const ONE_HOUR = 1000 * 60 * 60;

    const existingView = await RecipeView.findOne({
      where: {
        RecipeID: recipeId,
        [Op.or]: [
          { UserID: userId },
          { sessionId: sessionId }
        ],
        view_at: {
          [Op.gte]: new Date(Date.now() - ONE_HOUR)
        }
      }
    });

    // --- Record a new view if none found ---
    if (!existingView) {
      await RecipeView.create({
        RecipeID: recipeId,
        UserID: userId,
        sessionId: userId ? null : sessionId, // only store session for anonymous
        view_at: new Date()
      });
    }


    const recipe = await Recipe.findByPk(recipeId, {
      include: [
        { model: User, attributes: ['id', 'username'] },
        { model: Category, through: { attributes: [] } },
        {
          model: Instruction,
          include: [{ model: InstructionImg, attributes: ['instruction_imgID', 'imageURL'] }]
        },
        {
          model: Ingredient,
          include: [{ model: DataIngredient }]
        },
        {
          model: Comment,
          include: [{ model: User, attributes: ['id', 'username'] }],
          // remove order from here
        },
        {
          model: Favorite,
          where: { UserID: userId },
          required: false
        },
        {
          model: Like,
          where: { UserID: userId },
          required: false
        }
      ],
      order: [[Comment, 'CreatedAt', 'ASC']] // <-- order comments here
    });


    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    // Build nested comments
    const commentsMap = new Map();
    const commentsTree = [];
    recipe.Comments
      .filter(c => c.type !== 'alarm')
      .forEach(c => {
        const comment = {
          id: c.CommentID,
          content: c.Content,
          type: c.type,
          createdAt: c.CreatedAt,
          user: { id: c.User.id, username: c.User.username },
          replies: []
        };

        commentsMap.set(c.CommentID, comment);

        if (c.ParentCommentID) {
          const parent = commentsMap.get(c.ParentCommentID);
          if (parent) parent.replies.push(comment);
        } else {
          commentsTree.push(comment);
        }
      });

    // Build instructions with images
    const instructions = recipe.Instructions.map(i => ({
      id: i.instructionID,
      text: i.details,
      images: i.InstructionImgs.map(img => ({
        id: img.instruction_imgID,
        url: img.imageURL
      }))
    }));

    // Build ingredients & calculate nutrients
    const ingredients = [];
    const nutrients = { calories: 0, protein: 0, fat: 0, carbs: 0 };
    recipe.Ingredients.forEach(ing => {
      // console.log('Processing ingredient:', ing.DataIngredient);
      const data = ing.DataIngredient;
      const factor = unitToGram[ing.Unit] || 1; // fallback 1 if unit not mapped
      const amountInGrams = ing.Quantity * factor;
      const qtyMultiplier = amountInGrams / 100;

      nutrients.calories += (data.calories || 0) * qtyMultiplier;
      nutrients.protein += (data.protein || 0) * qtyMultiplier;
      nutrients.fat += (data.fat || 0) * qtyMultiplier;
      nutrients.carbs += (data.carbs || 0) * qtyMultiplier;

      ingredients.push({
        id: ing.IngredientID,
        name: data.name_th,
        quantity: ing.Quantity,
        unit: ing.Unit
      });
    });
    const sentData = {
      RecipeID: recipe.RecipeID,
      Title: recipe.Title,
      time: recipe.time,
      ImageURL: recipe.ImageURL,
      videoURL: recipe.videoURL,
      isFavorite: recipe.Favorites.length > 0,
      isLike: recipe.Likes.length > 0,
      user: { id: recipe.User.id, username: recipe.User.username },
      categories: recipe.Categories.map(c => ({
        id: c.id,
        name: c.Name
      })),
      instructions,
      ingredients,
      nutrients: {
        calories: Math.round(nutrients.calories),
        protein: Math.round(nutrients.protein * 10) / 10,
        fat: Math.round(nutrients.fat * 10) / 10,
        carbs: Math.round(nutrients.carbs * 10) / 10
      },
      comments: commentsTree
    }
    // console.dir(sentData, { depth: null });
    res.json(sentData);

  } catch (err) {
    console.error("Error fetching recipe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function extractPublicId(url) {
  const match = url.match(/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
}

router.put('/:id/edit', upload.fields([
  { name: 'recipeImage', maxCount: 1 },
  { name: 'stepImages', maxCount: 50 }
]), async (req, res) => {
  const RecipeID = req.params.id;
  const UserID = req.session.user?.id;

  if (!UserID) return res.status(401).json({ error: 'Unauthorized' });

  const { title, videoURL, time, ingredients, instructions, tags, removeRecipeImage } = req.body;
  const ingArr = ingredients ? JSON.parse(ingredients) : [];
  const stepsArr = instructions ? JSON.parse(instructions) : [];
  const tagsArr = tags ? JSON.parse(tags) : [];

  const t = await sequelize.transaction();

  try {
    // 1️⃣ Update Recipe basic info
    const recipe = await Recipe.findByPk(RecipeID, { transaction: t });
    if (!recipe) throw new Error('Recipe not found');

    recipe.Title = title;
    recipe.videoURL = videoURL || null;
    recipe.time = time || null;
    recipe.UpdatedAt = new Date();
    await recipe.save({ transaction: t });

    // 2️⃣ Handle main recipe image explicitly
    if (removeRecipeImage === 'true') {
      if (recipe.ImageURL) {
        const public_id = extractPublicId(recipe.ImageURL);
        await cloudinary.uploader.destroy(public_id);
        recipe.ImageURL = null;
        await recipe.save({ transaction: t });
      }
    } else if (req.files?.recipeImage?.[0]) {
      // Upload new image
      if (recipe.ImageURL) {
        const public_id = extractPublicId(recipe.ImageURL);
        await cloudinary.uploader.destroy(public_id);
      }
      const uploadedRecipe = await cloudinary.uploader.upload_stream_async(
        req.files.recipeImage[0].buffer,
        { folder: `image_project/recipe_${RecipeID}` }
      );
      recipe.ImageURL = uploadedRecipe.secure_url;
      await recipe.save({ transaction: t });
    }
    // else → keep old image

    // 3️⃣ Tags / Categories (same as before)
    const existingCategories = await RecipeCategory.findAll({
      where: { RecipeID },
      include: [{ model: Category }],
      transaction: t
    });
    const existingNames = existingCategories.map(rc => rc.Category?.Name || '');
    for (const rc of existingCategories) {
      if (!tagsArr.includes(rc.Category?.Name)) await rc.destroy({ transaction: t });
    }
    for (const tagName of tagsArr) {
      if (!tagName) continue;
      if (!existingNames.includes(tagName)) {
        let category = await Category.findOne({ where: { Name: tagName }, transaction: t });
        if (!category) category = await Category.create({ Name: tagName }, { transaction: t });
        await RecipeCategory.findOrCreate({
          where: { RecipeID, CategoryID: category.CategoryID },
          transaction: t
        });
      }
    }

    // 4️⃣ Ingredients
    const existingIngredients = await Ingredient.findAll({
      where: { RecipeID },
      include: [DataIngredient],
      transaction: t
    });

    // Remove old ingredients not in the new list
    for (const oldIng of existingIngredients) {
      if (!ingArr.find(i => i.name === oldIng.DataIngredient?.name_th)) {
        await oldIng.destroy({ transaction: t });
      }
    }

    // Add or update new ingredients
    for (const ing of ingArr) {
      if (!ing.name) continue;

      // ✅ Replace with your smart finder
      const dataIng = await findOrCreateIngredient(ing.name, t);

      // Update or insert Ingredient row
      let existing = await Ingredient.findOne({
        where: { RecipeID, RawIngredientID: dataIng.RawIngredientID },
        transaction: t
      });

      if (existing) {
        existing.Quantity = ing.quantity || 0;
        existing.Unit = ing.unit || '';
        await existing.save({ transaction: t });
      } else {
        await Ingredient.create({
          RecipeID,
          RawIngredientID: dataIng.RawIngredientID,
          Quantity: ing.quantity || 0,
          Unit: ing.unit || ''
        }, { transaction: t });
      }
    }


    // 5️⃣ Steps & Step Images
    const existingSteps = await Instruction.findAll({
      where: { RecipeID },
      include: [{ model: InstructionImg }],
      order: [['instructionID', 'ASC']],
      transaction: t
    });
    // console.dir(instructions);
    for (let i = 0; i < stepsArr.length; i++) {
      const step = stepsArr[i];
      let instruction = existingSteps[i];

      if (!instruction) {
        instruction = await Instruction.create({ RecipeID, details: step.text || '' }, { transaction: t });
        instruction.InstructionImgs = [];
      } else {
        instruction.details = step.text || '';
        await instruction.save({ transaction: t });
        instruction.InstructionImgs = await InstructionImg.findAll({
          where: { instructionID: instruction.instructionID },
          transaction: t
        });
      }

      const stepImagesFromFrontend = step.stepImages || [];
      // console.log('Step images from frontend:', stepImagesFromFrontend.map(img => img.url));
      const oldImages = instruction.InstructionImgs || [];
      // console.log('Old images:', oldImages.map(img => img.imageURL));
      // Delete images removed in frontend
      for (const oldImg of oldImages) {
        const stillExists = stepImagesFromFrontend.find(f => f.url === oldImg.imageURL && f.isOld);
        if (!stillExists) {
          const public_id = extractPublicId(oldImg.imageURL);
          await cloudinary.uploader.destroy(public_id);
          await oldImg.destroy({ transaction: t });
        }
      }

      // Upload new files
      const newFiles = stepImagesFromFrontend.filter(f => f.new && f.tempName);
      for (const file of newFiles) {
        const matchedFile = req.files?.stepImages?.find(f => f.originalname === file.tempName);
        if (!matchedFile) continue;

        const uploaded = await cloudinary.uploader.upload_stream_async(
          matchedFile.buffer,
          { folder: `image_project/recipe_${RecipeID}/steps` }
        );

        await InstructionImg.create({
          instructionID: instruction.instructionID,
          imageURL: uploaded.secure_url
        }, { transaction: t });
      }

    }

    // Delete old steps not in frontend
    for (let i = stepsArr.length; i < existingSteps.length; i++) {
      const oldStep = existingSteps[i];
      for (const img of oldStep.InstructionImgs) {
        const public_id = img.imageURL.match(/\/([^\/]+)\.[a-z]+$/)[1];
        await cloudinary.uploader.destroy(public_id);
        await img.destroy({ transaction: t });
      }
      await oldStep.destroy({ transaction: t });
    }

    await t.commit();
    res.json({ msg: 'Recipe updated successfully!', RecipeID });
  } catch (err) {
    await t.rollback();
    console.error('Error editing recipe:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/:id/comments', async (req, res) => {
  const userId = req.session.user?.id;
  const recipeId = req.params.id;
  const { content, parentId } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!content || !content.trim()) return res.status(400).json({ error: "Comment cannot be empty" });

  try {
    // Verify the recipe exists
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    // Create the comment
    const comment = await Comment.create({
      RecipeID: recipeId,
      UserID: userId,
      ParentCommentID: parentId || null,
      Content: content,
      type: 'normal'
    });

    // Fetch the comment with user info
    const createdComment = await Comment.findByPk(comment.CommentID, {
      include: [{ model: User, attributes: ['id', 'username'] }]
    });

    res.status(201).json({
      comment: {
        id: createdComment.CommentID,
        content: createdComment.Content,
        type: createdComment.type,
        createdAt: createdComment.CreatedAt,
        user: {
          id: createdComment.User.id,
          username: createdComment.User.username
        },
        replies: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
