const express = require('express');
const prisma = require('../config/prisma');

const { enregistrerAudit } = require('../utils/audit.util');

const routeur = express.Router();

/**
 * Récupérer toutes les transactions du client connecté.
 * Ici, on ne montre que les transactions liées à ses propres comptes,
 * ce qui est très important du point de vue sécurité.
 */
routeur.get('/', async (req, res) => {
  try {
    // On cherche d'abord les comptes appartenant à l'utilisateur connecté
    const comptes = await prisma.account.findMany({
      where: { userId: req.user.id },
      select: { id: true },
    });

    const idsComptes = comptes.map((compte) => compte.id);

    // Ensuite, on récupère toutes les transactions où l'un de ses comptes
    // apparaît soit comme compte source, soit comme compte destinataire
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { sourceAccountId: { in: idsComptes } },
          { targetAccountId: { in: idsComptes } },
        ],
      },
      include: {
        sourceAccount: true,
        targetAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(transactions);
  } catch (erreur) {
    console.error('Erreur lors de la récupération des transactions :', erreur);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

/**
 * Récupérer le détail d'une transaction précise.
 * Même si la transaction existe, on vérifie que le client y est bien lié.
 * Être connecté ne suffit pas : il faut aussi être autorisé.
 */
routeur.get('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        sourceAccount: true,
        targetAccount: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction introuvable' });
    }

    const possedeCompteSource = transaction.sourceAccount.userId === req.user.id;
    const possedeCompteCible = transaction.targetAccount.userId === req.user.id;

    if (!possedeCompteSource && !possedeCompteCible) {
      return res.status(403).json({
        message: 'Accès refusé à cette transaction',
      });
    }

    res.status(200).json(transaction);
  } catch (erreur) {
    console.error('Erreur lors de la récupération du détail de la transaction :', erreur);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

/**
 * Initier un virement bancaire fictif.
 * Règle métier choisie :
 * - si le montant est inférieur à 5000, on exécute directement
 * - si le montant est supérieur ou égal à 5000, on le met en attente
 */
routeur.post('/transfer', async (req, res) => {
  try {
    const { sourceAccountId, targetAccountId, amount, currency } = req.body;

    // Petite vérification de base pour éviter les requêtes incomplètes
    if (!sourceAccountId || !targetAccountId || !amount || !currency) {
      return res.status(400).json({
        message: 'sourceAccountId, targetAccountId, amount et currency sont obligatoires',
      });
    }

    const montant = Number(amount);

    if (Number.isNaN(montant) || montant <= 0) {
      return res.status(400).json({
        message: 'Le montant doit être un nombre positif',
      });
    }

    const compteSource = await prisma.account.findUnique({
      where: { id: sourceAccountId },
    });

    const compteCible = await prisma.account.findUnique({
      where: { id: targetAccountId },
    });

    if (!compteSource || !compteCible) {
      return res.status(404).json({
        message: 'Compte source ou compte cible introuvable',
      });
    }

    // Ici, on vérifie que le client essaie bien d'utiliser SON propre compte
    if (compteSource.userId !== req.user.id) {
      return res.status(403).json({
        message: 'Vous ne pouvez initier un virement qu\'à partir de votre propre compte',
      });
    }

    if (compteSource.status !== 'ACTIVE' || compteCible.status !== 'ACTIVE') {
      return res.status(400).json({
        message: 'Le compte source ou le compte cible n\'est pas actif',
      });
    }

    if (compteSource.currency !== currency || compteCible.currency !== currency) {
      return res.status(400).json({
        message: 'Les devises ne correspondent pas',
      });
    }

    if (Number(compteSource.balance) < montant) {
      return res.status(400).json({
        message: 'Solde insuffisant',
      });
    }

    let transactionCreee;

    // Si petit montant alors exécution immédiate
    if (montant < 5000) {
        transactionCreee = await prisma.$transaction(async (tx) => {
            const nouvelleTransaction = await tx.transaction.create({
            data: {
                sourceAccountId,
                targetAccountId,
                amount: montant,
                currency,
                status: 'EXECUTED',
                initiatedBy: req.user.id,
            },
            });

            await enregistrerAudit({
                userId: req.user.id,
                action: 'TRANSFER_CREATED',
                resourceType: 'TRANSACTION',
                resourceId: transactionCreee.id,
                status: 'SUCCESS',
                details: `Virement créé et exécuté immédiatement pour un montant de ${montant} ${currency}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            });

        // On débite le compte source
        await tx.account.update({
          where: { id: sourceAccountId },
          data: {
            balance: Number(compteSource.balance) - montant,
          },
        });

        // On crédite le compte cible
        await tx.account.update({
          where: { id: targetAccountId },
          data: {
            balance: Number(compteCible.balance) + montant,
          },
        });

        return nouvelleTransaction;
      });

    } else {
      // Si le montant important alors validation nécessaire plus tard
        transactionCreee = await prisma.transaction.create({
            data: {
            sourceAccountId,
            targetAccountId,
            amount: montant,
            currency,
            status: 'PENDING',
            initiatedBy: req.user.id,
            },
        });

        await enregistrerAudit({
            userId: req.user.id,
            action: 'TRANSFER_CREATED',
            resourceType: 'TRANSACTION',
            resourceId: transactionCreee.id,
            status: 'SUCCESS',
            details: `Virement créé en attente de validation pour un montant de ${montant} ${currency}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
        });
    }
    res.status(201).json(transactionCreee);

    } catch (erreur) {
        console.error('Erreur lors de la création du virement :', erreur);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

module.exports = routeur;