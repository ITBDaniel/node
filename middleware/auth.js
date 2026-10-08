import jwt from 'jsonwebtoken';
import { SECRET_JWT_KEY } from '../config.js';

// Middleware para sesión y autorización
export const wantsJson = (req) => {
  const accept = req.headers.accept || '';
  return req.is('application/json') || req.path.startsWith('/api') || accept.includes('application/json');
};

export const loadSession = (req, res, next) => {
  const token = req.cookies.access_token;
  req.session = { user: null };

  if (token) {
    try {
      const decoded = jwt.verify(token, SECRET_JWT_KEY);
      req.session.user = decoded;
    } catch (error) {
      req.session.user = null;
    }
  }

  res.locals.user = req.session.user;
  next();
};

export const authRequired = (req, res, next) => {
  if (!req.session.user) {
    if (wantsJson(req)) {
      return res.status(403).json({ error: 'Accés no autoritzat. Inicia sessió primer.' });
    }

    return res.status(403).render('login', {
      error: 'Accés no autoritzat. Inicia sessió primer.'
    });
  }

  next();
};
