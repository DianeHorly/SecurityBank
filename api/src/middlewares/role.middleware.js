/*function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const email = req.user?.email;

    if (!email) {
      return res.status(401).json({ message: 'Utilisateur non authentifié'});
    }

    let role = null;
   // On simule le role avec l'email
    if (email.startsWith('client')) role = 'client';
    if (email.startsWith('agent')) role = 'agent';
    if (email.startsWith('admin')) role = 'admin';

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        message: 'Accès interdit pour ce rôle',
      });
    }

    req.userRole = role;
    next();
  };
}
*/
function authorizeRoles(...rolesAutorises) {
  return (req, res, next) => {
    const rolesUtilisateur = req.user?.roles || [];

    const autorise = rolesAutorises.some((role) =>
      rolesUtilisateur.includes(role)
    );

    if (!autorise) {
      return res.status(403).json({
        message: 'Accès interdit : rôle non autorisé.',
      });
    }

    next();
  };
}

module.exports = authorizeRoles;