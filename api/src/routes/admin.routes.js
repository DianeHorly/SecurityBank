const express = require('express');
const prisma = require('../config/prisma');

const routeur = express.Router();

const { enregistrerAudit } = require('../utils/audit.util');

/**
 * Voir la liste des utilisateurs
 */
routeur.get('/users', async (req, res) => {
  try {
    const utilisateurs = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Liste des utilisateurs récupérée avec succès.',
      data: utilisateurs,
    });
  } catch (erreur) {
    console.error('Erreur récupération utilisateurs :', erreur);
    return res.status(500).json({
      message: 'Une erreur interne est survenue lors de la récupération des utilisateurs.',
    });
  }
});

/**
 * Changer le rôle d'un utilisateur
 * Ici, comme le rôle est simulé par l'email, on change le préfixe de l'email.
 * C'est provisoire, plus tard le rôle viendra de Keycloak / JWT.
 */
routeur.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['client', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Le rôle doit être client, agent ou admin.',
      });
    }

    const utilisateur = await prisma.user.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      return res.status(404).json({
        message: 'Utilisateur introuvable.',
      });
    }

    const ancienEmail = utilisateur.email;
    const partieApresArobase = ancienEmail.split('@')[1];
    const nouvelEmail = `${role}${Date.now()}@${partieApresArobase}`;

    const utilisateurMisAJour = await prisma.user.update({
      where: { id },
      data: {
        email: nouvelEmail,
      },
    });

    await enregistrerAudit({
        userId: req.user.id,
        action: 'USER_ROLE_UPDATED',
        resourceType: 'USER',
        resourceId: id,
        status: 'SUCCESS',
        details: `Le rôle de l\'utilisateur a été changé vers ${role}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
    });

    await enregistrerAudit({
        userId: req.user.id,
        action: 'USER_STATUS_UPDATED',
        resourceType: 'USER',
        resourceId: id,
        status: 'SUCCESS',
        details: `Le statut de l\'utilisateur a été changé vers ${status}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
    });

    return res.status(200).json({
      message: 'Le rôle de l\'utilisateur a été mis à jour avec succès.',
      data: utilisateurMisAJour,
    });
  } catch (erreur) {
    console.error('Erreur mise à jour rôle utilisateur :', erreur);
    return res.status(500).json({
      message: 'Une erreur interne est survenue lors de la mise à jour du rôle.',
    });
  }
});

/**
 * Suspendre ou réactiver un utilisateur
 */
routeur.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        message: 'Le statut doit être ACTIVE ou SUSPENDED.',
      });
    }

    const utilisateur = await prisma.user.findUnique({
      where: { id },
    });

    if (!utilisateur) {
      return res.status(404).json({
        message: 'Utilisateur introuvable.',
      });
    }

    const utilisateurMisAJour = await prisma.user.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      message:
        status === 'SUSPENDED'
          ? 'Le compte utilisateur a été suspendu avec succès.'
          : 'Le compte utilisateur a été réactivé avec succès.',
      data: utilisateurMisAJour,
    });
  } catch (erreur) {
    console.error('Erreur mise à jour statut utilisateur :', erreur);
    return res.status(500).json({
      message: 'Une erreur interne est survenue lors de la mise à jour du statut.',
    });
  }
});

routeur.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Liste des logs d\'audit récupérée avec succès.',
      data: logs,
    });
  } catch (erreur) {
    console.error('Erreur récupération logs audit :', erreur);
    return res.status(500).json({
      message: 'Une erreur interne est survenue lors de la récupération des logs d’audit.',
    });
  }
});

module.exports = routeur;