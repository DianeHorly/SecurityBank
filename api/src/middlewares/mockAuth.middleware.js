const prisma = require('../config/prisma');

async function mockAuth(req, res, next) {
  try {
    const email = req.header('x-user-email');

    if (!email) {
      return res.status(401).json({
        message: 'En-tête x-user-email manquant',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur introuvable',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        message: 'Le compte utilisateur n \'est pas actif',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('mockAuth error:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}

module.exports = mockAuth;