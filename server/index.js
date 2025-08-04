require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
const recipeRoute = require('./routes/recipe');
const outsourceRoute = require('./routes/outsource');

app.use(cors());
app.use(express.json());

// Mount routes with prefixes:
app.use('/api', mainRoute);             // e.g., GET /api/health
app.use('/api/users', userRoute);       // e.g., POST /api/users/login
app.use('/api/recipes', recipeRoute);   // e.g., GET /api/recipes/
app.use('/api/outsource', outsourceRoute); // e.g., GET /api/outsource/

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
