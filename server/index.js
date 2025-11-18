require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware ===== //
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' })); //use json
// app.use(express.urlencoded({ limit: '50mb', extended: true }));//use default form

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax', httpOnly: true },
}));

// ===== Auto-unban middleware ===== //
const autoUnban = require('./middleware/autoUnban')
app.use(autoUnban);

// ===== Routes ===== //
const mainRoute = require('./routes/main');
const userRoute = require('./routes/user');
const recipeRoute = require('./routes/recipe');
const outsourceRoute = require('./routes/outsource');

app.use('/api', mainRoute);
app.use('/api/users', userRoute);
app.use('/api/recipes', recipeRoute);
app.use('/api/outsource', outsourceRoute);

// ===== Error Handling ===== //
app.use((req, res, next) => {
  res.status(404).json({ message: '404 Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== Start server after DB connection ===== //
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('All models synchronized.');

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
