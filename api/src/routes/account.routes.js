const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId: req.user.id,
      },  
      include: {
        user: true,
      },
    });

    res.status(200).json(accounts);
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: true,
      },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.status(200).json(account);
  } catch (error) {
    console.error('GET /api/accounts/:id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;