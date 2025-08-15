import passport from 'passport';

export function ensureAuth(req, res, next) {
  if (req.isAuthenticated?.()) return next();
  return res.redirect('/login');
}

export function ensureApiAuth(req, res, next){
  if (req.isAuthenticated?.()) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

export function ensureRole(role){
  return (req, res, next) => {
    if (req.isAuthenticated?.() && req.user?.roles?.includes(role)) return next();
    return res.status(403).send('Forbidden');
  };
}

export function attachUserLocals(req, res, next){
  res.locals.user = req.user || null;
  next();
}
