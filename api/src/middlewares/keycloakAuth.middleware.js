const { createRemoteJWKSet, jwtVerify } = require('jose');

const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URI));

async function keycloakAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token Bearer manquant.',
      });
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.JWT_ISSUER,
    });

    req.user = {
      id: payload.sub,
      username: payload.preferred_username,
      email: payload.email || null,
      roles: payload.realm_access?.roles || [],
      tokenPayload: payload,
    };

    next();
  } catch (erreur) {
    console.error('Erreur de validation JWT :', erreur);
    return res.status(401).json({
      message: 'Token invalide ou expiré.',
    });
  }
}

module.exports = keycloakAuth;