const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ msg: 'List all recipes' });
});

router.post('/', (req, res) => {
  res.json({ msg: 'Create new recipe' });
});

module.exports = router;
