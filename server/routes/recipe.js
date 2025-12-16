const express = require('express');
const router = express.Router();
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
const { Op, Sequelize } = require('sequelize');

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
  "ไข่เป็ด": { eng: "duck egg", synonyms: ["duck eggs"] },
  "ไข่ไก่": { eng: "chicken egg", synonyms: ["chicken eggs"] },
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

// 0️⃣ Manual fallback for Thai-specific ingredients
const thaiFallback = {
  // Seasonings / condiments
  "น้ำปลา": { eng: "fish sauce", calories: 13, protein: 0.1, fat: 0, carbs: 2.7 },
  "น้ำตาล": { eng: "sugar", calories: 387, protein: 0, fat: 0, carbs: 100 },
  "ผงปรุงรส": { eng: "seasoning powder", calories: 250, protein: 3.7, fat: 0.5, carbs: 79.6 },
  "กะปิ": { eng: "shrimp paste", calories: 240, protein: 35, fat: 5, carbs: 0 },
  "ซีอิ๊ว": { eng: "soy sauce", calories: 53, protein: 5, fat: 0, carbs: 4.9 },
  "ซีอิ๊วดำ": { eng: "dark soy sauce", calories: 50, protein: 5, fat: 0, carbs: 5 },
  "น้ำมันพืช": { eng: "vegetable oil", calories: 884, protein: 0, fat: 100, carbs: 0 },
  "น้ำมันมะพร้าว": { eng: "coconut oil", calories: 862, protein: 0, fat: 100, carbs: 0 },
  "น้ำมันงา": { eng: "sesame oil", calories: 884, protein: 0, fat: 100, carbs: 0 },
  "เกลือ": { eng: "salt", calories: 0, protein: 0, fat: 0, carbs: 0 },
  "ผงชูรส": { eng: "MSG", calories: 0, protein: 0, fat: 0, carbs: 0 },
  "น้ำส้มสายชู": { eng: "vinegar", calories: 0, protein: 0, fat: 0, carbs: 0 },
  "พริกป่น": { eng: "chili powder", calories: 0, protein: 0, fat: 0, carbs: 0 },
  "พริกไทยป่น": { eng: "ground black pepper", calories: 0, protein: 0, fat: 0, carbs: 0 },
  // Herbs / vegetables
  "ตะไคร้": { eng: "lemongrass", calories: 99, protein: 1.8, fat: 0.5, carbs: 25.0 },
  "ข่า": { eng: "galangal", calories: 80, protein: 1.8, fat: 0.3, carbs: 18.0 },
  "ใบมะกรูด": { eng: "kaffir lime leaf", calories: 0, protein: 0, fat: 0, carbs: 0 },
  "พริกไทย": { eng: "black pepper", calories: 255, protein: 10, fat: 3.3, carbs: 64 },
  "พริกขี้หนู": { eng: "bird's eye chili", calories: 40, protein: 2, fat: 0.5, carbs: 9 },
  "พริกชี้ฟ้า": { eng: "red chili", calories: 31, protein: 1.5, fat: 0.3, carbs: 7 },
  "ขมิ้น": { eng: "turmeric", calories: 312, protein: 9.7, fat: 3.3, carbs: 67.1 },
  "มะนาว": { eng: "lime", calories: 30, protein: 0.7, fat: 0.2, carbs: 11 },
  "มะขามเปียก": { eng: "tamarind", calories: 239, protein: 2.8, fat: 0.6, carbs: 62.5 },
  "หอมแดง": { eng: "shallot", calories: 72, protein: 2.5, fat: 0.1, carbs: 16.8 },
  "กระเทียม": { eng: "garlic", calories: 149, protein: 6.4, fat: 0.5, carbs: 33 },
  "ผักชี": { eng: "coriander", calories: 23, protein: 2.1, fat: 0.5, carbs: 3.7 },
  "ผักชีฝรั่ง": { eng: "parsley", calories: 36, protein: 3, fat: 0.8, carbs: 6 },
  "ใบโหระพา": { eng: "thai basil", calories: 23, protein: 3, fat: 0.6, carbs: 4 },
  "สะระแหน่": { eng: "mint", calories: 70, protein: 3.8, fat: 0.9, carbs: 15 },
  "ตะไคร้หอม": { eng: "lemon balm", calories: 44, protein: 3, fat: 0.5, carbs: 10 },
  "มะกรูด": { eng: "kaffir lime", calories: 30, protein: 0.8, fat: 0.2, carbs: 7 },
  "น้ำมะนาว": { eng: "lime juice", calories: 20, protein: 0.3, fat: 0, carbs: 6 },

  // Eggs
  "ไข่เป็ด": { eng: "duck egg", calories: 123, protein: 19.8, fat: 4.25, carbs: 0 },
  "ไข่ไก่": { eng: "chicken egg", calories: 68, protein: 5.5, fat: 4.8, carbs: 0.6 },
  "ไข่": { eng: "egg", calories: 68, protein: 5.5, fat: 4.8, carbs: 0 },

  // Thai curry pastes
  "พริกแกงแดง": { eng: "red curry paste", calories: 200, protein: 4, fat: 10, carbs: 20 },
  "พริกแกงเขียว": { eng: "green curry paste", calories: 180, protein: 3, fat: 9, carbs: 18 },
  "พริกแกงเผ็ด": { eng: "spicy curry paste", calories: 190, protein: 3.5, fat: 9, carbs: 19 },
  "พริกแกงเหลือง": { eng: "yellow curry paste", calories: 185, protein: 3, fat: 8.5, carbs: 18 },
  "พริกแกงมัสมั่น": { eng: "massaman curry paste", calories: 210, protein: 4, fat: 11, carbs: 21 },
  "พริกแกงพะแนง": { eng: "panang curry paste", calories: 205, protein: 4, fat: 10, carbs: 20 },
  "พริกแกงป่า": { eng: "jungle curry paste", calories: 180, protein: 3, fat: 9, carbs: 16 },
  "พริกแกงกะหรี่": { eng: "curry powder paste", calories: 200, protein: 3.5, fat: 10, carbs: 20 },

  // Dried seafood
  "กุ้งแห้ง": { eng: "dried shrimp", calories: 200, protein: 45, fat: 2, carbs: 3 },
  "ปลาหมึกแห้ง": { eng: "dried squid", calories: 250, protein: 50, fat: 2, carbs: 4 },
  "ปลาแห้ง": { eng: "dried fish", calories: 250, protein: 45, fat: 5, carbs: 0 },

  // Fermented products
  "ปลาร้า": { eng: "fermented fish", calories: 120, protein: 20, fat: 3, carbs: 2 },
  "เต้าเจี้ยว": { eng: "fermented soybean paste", calories: 199, protein: 12, fat: 6, carbs: 22 },
  "น้ำเต้าเจี้ยว": { eng: "fermented soybean sauce", calories: 45, protein: 5, fat: 0, carbs: 4 },
  // Thai vegetables
  "ผักบุ้ง": { eng: "morning glory", calories: 19, protein: 3, fat: 0.2, carbs: 3.1 },
  "ผักกาดขาว": { eng: "chinese cabbage", calories: 12, protein: 1.2, fat: 0.1, carbs: 2 },
  "ผักกาดหอม": { eng: "lettuce", calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9 },
  "ผักโขม": { eng: "spinach", calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6 },
  "คะน้า": { eng: "chinese kale", calories: 28, protein: 3, fat: 0.3, carbs: 5 },
  "มะเขือเปราะ": { eng: "thai eggplant", calories: 24, protein: 1, fat: 0.2, carbs: 5 },
  "มะเขือม่วง": { eng: "eggplant", calories: 25, protein: 1, fat: 0.2, carbs: 6 },
  "มะเขือยาว": { eng: "long eggplant", calories: 25, protein: 1, fat: 0.2, carbs: 6 },
  "แตงกวา": { eng: "cucumber", calories: 16, protein: 0.7, fat: 0.1, carbs: 3.6 },
  "ฟักทอง": { eng: "pumpkin", calories: 26, protein: 1, fat: 0.1, carbs: 6 },
  "แครอท": { eng: "carrot", calories: 41, protein: 0.9, fat: 0.2, carbs: 10 },
  "ผักกวางตุ้ง": { eng: "choy sum", calories: 19, protein: 2, fat: 0.2, carbs: 3 },
  "รากผักชี": { eng: "cilantro root", calories: 23, protein: 2, fat: 0.2, carbs: 4 },

  // Thai fruits
  "มะละกอ": { eng: "papaya", calories: 43, protein: 0.5, fat: 0.1, carbs: 11 },
  "มะม่วง": { eng: "mango", calories: 60, protein: 0.8, fat: 0.4, carbs: 15 },
  "แตงโม": { eng: "watermelon", calories: 30, protein: 0.6, fat: 0.2, carbs: 8 },
  "มะเขือเทศ": { eng: "tomato", calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
  "ฟัก": { eng: "winter melon", calories: 13, protein: 0.4, fat: 0.2, carbs: 3 },
  "ฟักอ่อน": { eng: "young winter melon", calories: 15, protein: 0.5, fat: 0.2, carbs: 3.2 },
  "มะระ": { eng: "bitter melon", calories: 17, protein: 1, fat: 0.2, carbs: 3.7 },

  // Herbs for flavor
  "ผักชี": { eng: "coriander", calories: 23, protein: 2.1, fat: 0.5, carbs: 3.7 },
  "ผักชีฝรั่ง": { eng: "parsley", calories: 36, protein: 3, fat: 0.8, carbs: 6 },
  "ใบโหระพา": { eng: "thai basil", calories: 23, protein: 3, fat: 0.6, carbs: 4 },
  "สะระแหน่": { eng: "mint", calories: 70, protein: 3.8, fat: 0.9, carbs: 15 },
};

// Sort keys by length descending for correct compound matching
const sortedIngredientKeys = Object.keys(ingredientData).sort((a, b) => b.length - a.length);

// Helper: check if ingredient is common raw food
function isCommonRawFood(thaiName) {
  return ingredientData[thaiName] !== undefined;
}

// 2️⃣ Map Thai -> English with compound handling
async function mapIngredient(thaiInput) {
  thaiInput = thaiInput.trim();

  // Match longest key first
  for (const key of sortedIngredientKeys) {
    if (thaiInput.includes(key)) {
      return ingredientData[key].eng;
    }
  }

  // Fallback: use translation API
  return await libreTranslateThaiToEng(thaiInput);
}

function chooseBestFood(rawFoods, engName, thaiName = '') {
  const lowerName = engName.toLowerCase();

  // Define categories
  const meatCategories = ['Poultry Products', 'Beef Products', 'Pork Products', 'Seafood Products'];
  const plantCategories = ['Vegetables and Vegetable Products', 'Fruits and Fruit Juices', 'Legumes and Legume Products'];
  const spiceCategories = ['Spices and Herbs', 'Condiments and Sauces'];
  const dairyCategories = ['Dairy and Egg Products'];

  // Determine ingredient type based on Thai name / fallback
  let type = 'plant';
  if (thaiName.match(/ไก่|หมู|วัว|เนื้อ|เป็ด|กุ้ง|ปู|ปลา|ไข่/)) type = 'meat';
  else if (thaiName.match(/พริก|เกลือ|น้ำตาล|น้ำปลา|ซอส|น้ำมัน|เครื่องเทศ|herb|spice/i)) type = 'spice';
  else if (thaiName.match(/นม|เนย|ชีส|ไข่/)) type = 'dairy';

  // 1️⃣ Exact match
  let match = rawFoods.find(f =>
    f.description.toLowerCase() === lowerName ||
    Object.values(ingredientData).some(data =>
      data.eng.toLowerCase() === lowerName &&
      data.synonyms.some(s => f.description.toLowerCase().includes(s.toLowerCase()))
    )
  );
  if (match) {
    console.log('✅ Exact match found:');
    console.dir(match, { depth: 1 });
    return match;
  }

  // 2️⃣ Partial match filtered by ingredient type
  match = rawFoods.find(f => {
    const desc = f.description.toLowerCase();
    const isPartial = desc.includes(lowerName) ||
      Object.values(ingredientData).some(data =>
        data.eng.toLowerCase() === lowerName &&
        data.synonyms.some(s => desc.includes(s.toLowerCase()))
      );

    // Filter by type
    if (!isPartial) return false;
    if (type === 'plant') return plantCategories.includes(f.foodCategory) || spiceCategories.includes(f.foodCategory);
    if (type === 'meat') return meatCategories.includes(f.foodCategory);
    if (type === 'spice') return spiceCategories.includes(f.foodCategory) || plantCategories.includes(f.foodCategory);
    if (type === 'dairy') return dairyCategories.includes(f.foodCategory);
    return true;
  });
  if (match) {
    console.log('🔹 Partial match found (type filter):');
    console.dir(match, { depth: 0 });
    return match;
  }

  // 3️⃣ Fallback to categories
  const categoryMap = {
    plant: [...plantCategories, ...spiceCategories],
    meat: meatCategories,
    spice: [...spiceCategories, ...plantCategories],
    dairy: dairyCategories
  };

  match = rawFoods.find(f => categoryMap[type].includes(f.foodCategory));
  if (match) {
    console.log(`🍃 Fallback to ${type} category:`);
    console.dir(match, { depth: 0 });
    return match;
  }

  // 4️⃣ Final fallback
  console.log('⚠️ Fallback to first raw food:');
  console.dir(rawFoods[0], { depth: 0 });
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
  // console.dir(foods)
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
  thaiName = thaiName.trim();

  // Check existing DB
  let dataIng = await DataIngredient.findOne({ where: { name_th: thaiName }, transaction });
  if (dataIng) {
    console.log(`Found existing ingredient in DB: ${thaiName}`);
    return dataIng;
  }

  // Manual fallback for seasonings
  if (thaiFallback[thaiName]) {
    const fallback = thaiFallback[thaiName];
    console.log(`Using manual fallback for "${thaiName}" -> "${fallback.eng}"`);
    return await DataIngredient.create({
      name_th: thaiName,
      name_eng: fallback.eng,
      calories: fallback.calories,
      protein: fallback.protein,
      fat: fallback.fat,
      carbs: fallback.carbs,
      source: 'manual',
      is_verified: true,
    }, { transaction });
  }



  // Map Thai -> English
  const engName = await mapIngredient(thaiName);
  console.log(`Mapped "${thaiName}" -> "${engName}"`);

  // If it's a common raw food, try USDA enrichment
  let nutrition = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  let chosenFood = null;

  if (engName) {
    let foods = await searchUsdaByName(engName, true);
    let rawFoods = filterRawFoods(foods);

    if (!rawFoods.length) {
      foods = await searchUsdaByName(engName, false);
      rawFoods = filterRawFoods(foods);
    }

    if (rawFoods.length) {
      chosenFood = chooseBestFood(rawFoods, engName, thaiName);
      nutrition = extractNutrition(chosenFood);
      console.log(`USDA enriched nutrition: ${chosenFood.description} (FDC ID: ${chosenFood.fdcId})`);
    }
  }

  // Insert into DB
  dataIng = await DataIngredient.create({
    name_th: thaiName,
    name_eng: engName,
    calories: nutrition.calories,
    protein: nutrition.protein,
    fat: nutrition.fat,
    carbs: nutrition.carbs,
    external_id: chosenFood?.fdcId || null,
    source: chosenFood ? 'USDA' : 'local',
    is_verified: !!chosenFood,
  }, { transaction });

  return dataIng;
}

const testCases = ["มะระ", "น้ำปลา", "มะเขือเทศ", "เกลือ", "ออริกาโน"];
async function runTests(testCases) {
  // Sequelize transaction is optional, you can pass `null` too
  const transaction = null;
  for (const name of testCases) {
    console.log("\n=== Testing:", name, "===");
    try {
      const result = await findOrCreateIngredient(name, transaction);

      let resolvedFrom;
      if (result.source === "manual") {
        resolvedFrom = "✅ Resolved from self table (thaiFallback)";
      } else if (result.source === "USDA") {
        resolvedFrom = "✅ Resolved from USDA";
      } else if (result.source === "local") {
        resolvedFrom = "⚠️ Local fallback (no USDA, no manual)";
      } else {
        resolvedFrom = "ℹ️ Found existing in DB";
      }

      console.log("👉 Input:", name);
      console.log("👉 Output:", result);
      console.log("👉 Resolved From:", resolvedFrom);
    } catch (err) {
      console.error("❌ Error for", name, ":", err.message);
    }
  }

  // if you use Sequelize, close connection after test
  if (Op.sequelize) {
    await Op.sequelize.close();
  }
}
// runTests(testCases);


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

router.get('/getData/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({ attributes: ['Name'] });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/getData/ingredients', async (req, res) => {
  try {
    const ingredients = await DataIngredient.findAll({ attributes: ['name_th'] });
    res.json(ingredients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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

    await t.commit();
    res.json({ msg: 'การแชร์เสร็จสมบูรณ์', RecipeID });
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

    const includeModels = [
      { model: User, attributes: ['id', 'username'] },
      { model: Category, attributes: ['Name'], through: { attributes: [] } },
    ];
    if (includeIngredient === 'true') {
      includeModels.push({
        model: Ingredient,
        include: [{ model: DataIngredient, attributes: ['name_eng', 'name_th'] }],
      });
    }
    const orConditions = [];
    // Text search
    if (q) {

      const searchTerms = q
        .split(' ')
        .map(term => term.trim())

      orConditions.push({ Title: { [Op.like]: `%${q}%` } });//title
      orConditions.push({ '$User.username$': { [Op.like]: `%${q}%` } });//user

      const matchingCategories = await Category.findAll({
        where: { Name: { [Op.like]: `%${q}%` } },
        include: [
          {
            model: Recipe,
            attributes: ['RecipeID'],
            through: { attributes: [] },
          },
        ],
      });
      const categoryRecipeIds = new Set();
      matchingCategories.forEach(cat => {
        (cat.Recipes || []).forEach(r => categoryRecipeIds.add(r.RecipeID));
      });

      if (categoryRecipeIds.size > 0) {
        orConditions.push({ RecipeID: { [Op.in]: Array.from(categoryRecipeIds) } });
      }
      // If includeIngredient is true, also search in ingredients
      if (includeIngredient === 'true') {

        const andIngredientConditions = searchTerms.map(term => ({
          [Op.or]: [
            { '$Ingredients.DataIngredient.name_eng$': { [Op.like]: `%${term}%` } },
            { '$Ingredients.DataIngredient.name_th$': { [Op.like]: `%${term}%` } },
          ],
        }));

        orConditions.push({ [Op.or]: andIngredientConditions });
        // orConditions.push(
        //   { '$Ingredients.DataIngredient.name_eng$': { [Op.like]: `%${q}%` } },
        //   { '$Ingredients.DataIngredient.name_th$': { [Op.like]: `%${q}%` } }
        // );
      }


      if (orConditions.length > 0) {
        where[Op.or] = orConditions;
      }
    }

    // Time filter
    if (minTime && maxTime) {
      where.time = { [Op.between]: [Number(minTime), Number(maxTime)] };
    } else if (minTime) {
      where.time = { [Op.gte]: Number(minTime) };
    } else if (maxTime) {
      where.time = { [Op.lte]: Number(maxTime) };
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
    // --- Record a new view if none found ---
    if (!existingView) {
      await RecipeView.create({
        RecipeID: recipeId,
        UserID: userId,
        sessionId: userId ? null : sessionId, // only store session for anonymous
        view_at: new Date()
      });
    }
    // --- Build nested comments (safe two-pass) ---
    const commentsMap = new Map();
    const commentsTree = [];

    // 1. First pass → create comment objects
    recipe.Comments
      .filter(c => c.type !== 'alarm')
      .forEach(c => {
        commentsMap.set(c.CommentID, {
          id: c.CommentID,
          content: c.Content,
          type: c.type,
          createdAt: c.CreatedAt,
          user: c.User
            ? { id: c.User.id, username: c.User.username }
            : { id: null, username: "deleted User" },
          replies: []
        });
      });

    // 2. Second pass → link children to parents
    recipe.Comments
      .filter(c => c.type !== 'alarm')
      .forEach(c => {
        const comment = commentsMap.get(c.CommentID);
        if (c.ParentCommentID) {
          const parent = commentsMap.get(c.ParentCommentID);
          if (parent) {
            parent.replies.push(comment);
          } else {
            // Parent deleted or missing → treat as root-level
            commentsTree.push(comment);
          }
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
    res.json({ msg: 'เมนูถูกอัพเดทแล้ว!', RecipeID });
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
