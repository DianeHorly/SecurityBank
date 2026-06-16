const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    //user: req.user,
    //role: req.userRole || null,
    message: 'Profil utilisateur récupéré avec succès.',
    data: req.user,
  });
});

module.exports = router;