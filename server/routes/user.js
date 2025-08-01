const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  // Handle login
  res.json({ msg: 'User login route' });
});

router.post('/register', (req, res) => {
  // Handle registration
  res.json({ msg: 'User register route' });
});

module.exports = router;
