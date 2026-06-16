const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SecureBank API is running',
  });
});

router.get('/info', (req, res) => {
  res.status(200).json({
    name: 'SecureBank API',
    version: '1.0.0',
    description: 'Secure banking API demo for PFE',
  });
});

module.exports = router;