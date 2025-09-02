// models/index.js
const sequelize = require('../db');

// Import models
const User = require('./User');
const Recipe = require('./Recipe');
const Category = require('./Category');
const RecipeCategory = require('./RecipeCategory');
const DataIngredient = require('./DataIngredient');
const Ingredient = require('./Ingredient');
const Instruction = require('./Instruction');
const InstructionImg = require('./InstructionImg');
const Comment = require('./Comment');
const Like = require('./Like');
const Favorite = require('./Favorite');
const RecipeView = require('./RecipeView');
const Report = require('./Report');
const ReportEvidence = require('./ReportEvidence');

// ===== Associations ===== //

// User ↔ Recipes
User.hasMany(Recipe, { foreignKey: 'UserID' });
Recipe.belongsTo(User, { foreignKey: 'UserID' });

// Recipe ↔ Category (Many-to-Many)
Recipe.belongsToMany(Category, { through: RecipeCategory, foreignKey: 'RecipeID' });
Category.belongsToMany(Recipe, { through: RecipeCategory, foreignKey: 'CategoryID' });

// tell Sequelize that RecipeCategory has a Category
RecipeCategory.belongsTo(Category, { foreignKey: 'CategoryID' });
Category.hasMany(RecipeCategory, { foreignKey: 'CategoryID' });

// Recipe ↔ Ingredients
Recipe.hasMany(Ingredient, { foreignKey: 'RecipeID' });
Ingredient.belongsTo(Recipe, { foreignKey: 'RecipeID' });
DataIngredient.hasMany(Ingredient, { foreignKey: 'RawIngredientID' });
Ingredient.belongsTo(DataIngredient, { foreignKey: 'RawIngredientID' });

// Recipe ↔ Instructions
Recipe.hasMany(Instruction, { foreignKey: 'RecipeID' });
Instruction.belongsTo(Recipe, { foreignKey: 'RecipeID' });

// Instruction ↔ InstructionImg
Instruction.hasMany(InstructionImg, { foreignKey: 'instructionID' });
InstructionImg.belongsTo(Instruction, { foreignKey: 'instructionID' });

// Recipe ↔ Comments
Recipe.hasMany(Comment, { foreignKey: 'RecipeID' });

// Comments
Comment.belongsTo(User, { foreignKey: 'UserID' });
Comment.belongsTo(Recipe, { foreignKey: 'RecipeID' });
Comment.belongsTo(Comment, { foreignKey: 'ParentCommentID' });
Comment.hasMany(Comment, { foreignKey: 'ParentCommentID' });

// Likes & Favorites
Like.belongsTo(User, { foreignKey: 'UserID' });
Like.belongsTo(Recipe, { foreignKey: 'RecipeID' });
User.hasMany(Like, { foreignKey: 'UserID' });
Recipe.hasMany(Like, { foreignKey: 'RecipeID' });

Favorite.belongsTo(User, { foreignKey: 'UserID' });
Favorite.belongsTo(Recipe, { foreignKey: 'RecipeID' });
User.hasMany(Favorite, { foreignKey: 'UserID' });
Recipe.hasMany(Favorite, { foreignKey: 'RecipeID' });

// Recipe Views
RecipeView.belongsTo(User, { foreignKey: 'UserID' });
RecipeView.belongsTo(Recipe, { foreignKey: 'RecipeID' });
User.hasMany(RecipeView, { foreignKey: 'UserID' });
Recipe.hasMany(RecipeView, { foreignKey: 'RecipeID' });

// Reports & ReportEvidence
User.hasMany(Report, { foreignKey: 'Reporter_id' });
Report.belongsTo(User, { foreignKey: 'Reporter_id' });
Report.hasMany(ReportEvidence, { foreignKey: 'ReportID' });
ReportEvidence.belongsTo(Report, { foreignKey: 'ReportID' });

// Export all models
module.exports = {
    sequelize,
    User,
    Recipe,
    Category,
    RecipeCategory,
    DataIngredient,
    Ingredient,
    Instruction,
    InstructionImg,
    Comment,
    Like,
    Favorite,
    RecipeView,
    Report,
    ReportEvidence,
};
