const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ msg: 'Welcome to API root' });
});
router.get('/message', (req, res) => {
  res.json({ msg: 'this is message for API route ,HAHA!' });
});
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

module.exports = router;
