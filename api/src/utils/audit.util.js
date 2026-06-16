const prisma = require('../config/prisma');

async function enregistrerAudit({
  userId = null,
  action,
  resourceType,
  resourceId = null,
  status,
  details = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        status,
        details,
        ipAddress,
        userAgent,
      },
    });
  } catch (erreur) {
    console.error('Erreur lors de l\'enregistrement du log d\'audit :', erreur);
  }
}

module.exports = { enregistrerAudit };