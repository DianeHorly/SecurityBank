const express = require('express');
const prisma = require('../config/prisma');

const routeur = express.Router();

const { enregistrerAudit } = require('../utils/audit.util');

/**
 * Liste des transactions en attente de validation
 */
routeur.get('/transactions/pending', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        sourceAccount: true,
        targetAccount: true,
        initiator: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (transactions.length === 0) {
      return res.status(200).json({
        message: 'Aucune transaction en attente de validation.',
        data: [],
      });
    }

    res.status(200).json({
      message: 'Liste des transactions en attente récupérée avec succès.',
      data: transactions,
    });
  } catch (erreur) {
    console.error('Erreur lors de la récupération des transactions en attente :', erreur);
    res.status(500).json({
      message: 'Une erreur interne est survenue lors de la récupération des transactions en attente.',
    });
  }
});

/**
 * Approuver une transaction en attente
 */
routeur.patch('/transactions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        sourceAccount: true,
        targetAccount: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction introuvable.',
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Cette transaction a déjà été traitée et ne peut plus être approuvée.',
      });
    }

    const transactionMiseAJour = await prisma.$transaction(async (tx) => {
      const transactionApprouvee = await tx.transaction.update({
        where: { id },
        data: {
          status: 'APPROVED',
          validatedBy: req.user.id,
          validatedAt: new Date(),
        },
      });
    
    await enregistrerAudit({
        userId: req.user.id,
        action: 'TRANSFER_APPROVED',
        resourceType: 'TRANSACTION',
        resourceId: id,
        status: 'SUCCESS',
        details: 'Transaction approuvée par un agent',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
    });

      await tx.account.update({
        where: { id: transaction.sourceAccountId },
        data: {
          balance: Number(transaction.sourceAccount.balance) - Number(transaction.amount),
        },
      });

      await tx.account.update({
        where: { id: transaction.targetAccountId },
        data: {
          balance: Number(transaction.targetAccount.balance) + Number(transaction.amount),
        },
      });

      // Après validation, on considère l'opération comme exécutée
      const transactionExecutee = await tx.transaction.update({
        where: { id },
        data: {
          status: 'EXECUTED',
        },
      });

      return transactionExecutee;
    });

    res.status(200).json({
      message: 'La transaction a été approuvée avec succès.',
      data: transactionMiseAJour,
    });
  } catch (erreur) {
    console.error('Erreur lors de l\'approbation de la transaction :', erreur);
    res.status(500).json({
      message: 'Une erreur interne est survenue lors de l\'approbation de la transaction.',
    });
  }
});

/**
 * Rejeter une transaction en attente
 */
routeur.patch('/transactions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: 'Le motif du rejet est obligatoire.',
      });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction introuvable.',
      });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Cette transaction a déjà été traitée et ne peut plus être rejetée.',
      });
    }

    const transactionRejetee = await prisma.transaction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        validatedBy: req.user.id,
        validatedAt: new Date(),
      },
    });
    
    await enregistrerAudit({
        userId: req.user.id,
        action: 'TRANSFER_REJECTED',
        resourceType: 'TRANSACTION',
        resourceId: id,
        status: 'SUCCESS',
        details: `Transaction rejetée par un agent. Motif : ${reason}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
    });
    
    res.status(200).json({
      message: 'La transaction a été rejetée avec succès.',
      data: transactionRejetee,
    });
  } catch (erreur) {
    console.error('Erreur lors du rejet de la transaction :', erreur);
    res.status(500).json({
      message: 'Une erreur interne est survenue lors du rejet de la transaction.',
    });
  }
});

module.exports = routeur;