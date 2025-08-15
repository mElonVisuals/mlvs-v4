import { Router } from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';

const log = (...a)=>console.log('[auth]', ...a);

const router = Router();

const scopes = ['identify','guilds'];

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
  console.warn('[auth] Discord OAuth env vars missing (DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET)');
}

const callbackURL = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3005/callback';
log('Using callback URL:', callbackURL);

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID || '0',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '0',
  callbackURL,
  scope: scopes
}, (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      tag: `${profile.username}#${profile.discriminator}`,
      guilds: profile.guilds || []
    };
    log('OAuth success for user', user.tag);
    return done(null, user);
  } catch (e) {
    log('Profile processing error', e?.message || e);
    return done(e);
  }
}));

router.get('/login', (req, res, next) => {
  log('Initiating OAuth login');
  passport.authenticate('discord')(req, res, next);
});

router.get('/callback', (req, res, next) => {
  log('Received OAuth callback');
  passport.authenticate('discord', (err, user) => {
    if (err) {
      log('OAuth error:', err);
      return res.redirect('/auth/failure?reason=' + encodeURIComponent(err.message || 'error'));
    }
    if (!user) {
      log('OAuth no user returned');
      return res.redirect('/auth/failure?reason=missing_user');
    }
    req.logIn(user, (e) => {
      if (e) {
        log('Session login error:', e);
        return res.redirect('/auth/failure?reason=session');
      }
      log('User logged in; redirecting to /dashboard');
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

router.get('/auth/failure', (req, res) => {
  const reason = req.query.reason || 'unknown';
  res.status(500).send(`<h1>OAuth Failed</h1><p>Reason: ${reason}</p><p>Check server logs for details.</p>`);
});

router.post('/logout', (req, res, next) => {
  const sidCookieName = (req.session?.cookieName) || (req.session?.name) || 'connect.sid';
  const startTs = Date.now();
  const debug = (...m)=> console.log('[auth][logout]', ...m);
  debug('init', { sidCookieName, sessionId: req.sessionID, hasSession: !!req.session, user: !!req.user });
  // Ensure CSRF token present if middleware applied (will 403 before here if invalid)
  // Null user early (Passport 0.7+ logout sync optional but we guard)
  if (req.user) { req.user = null; debug('user nulled early'); }
  function clearCookies(){
    try { res.clearCookie(sidCookieName, { path: '/' }); debug('clearCookie primary', sidCookieName); } catch(e){ debug('clearCookie primary fail', e.message); }
    try { res.clearCookie('connect.sid', { path: '/' }); debug('clearCookie fallback connect.sid'); } catch{}
    try { res.clearCookie(sidCookieName, { path: '/', sameSite:'lax' }); } catch{}
  }
  // Passport logout
  try {
    req.logout?.(err => {
      if (err) { debug('passport logout error', err); return next(err); }
      debug('passport logout callback');
      if (!req.session) {
        debug('no session object; clearing cookies and redirect');
        clearCookies();
        return res.redirect('/home');
      }
      const oldId = req.sessionID;
      // Copy ref so we can still access store after destroy
      const store = req.sessionStore;
      // Clear cookies early to instruct browser to drop session id
      clearCookies();
      const destroyFn = () => req.session.destroy(destroyErr => {
        if (destroyErr) debug('session destroy error', destroyErr.message);
        else debug('session destroyed', { oldId });
        // Regenerate fresh session id BEFORE redirect to avoid browser caching of previous cookie
        try {
          store?.generate?.(req); // create empty session
          debug('session regenerated newId', req.sessionID);
        } catch(e){ debug('session regenerate failed', e.message); }
        debug('redirecting', { elapsedMs: Date.now()-startTs });
        return res.redirect('/home');
      });
      // Attempt explicit store destroy if available
      try {
        store?.destroy?.(oldId, (e)=>{ if (e) debug('store.destroy error', e.message); destroyFn(); });
      } catch { destroyFn(); }
    });
  } catch (e) {
    debug('exception', e.message);
    clearCookies();
    return res.redirect('/home');
  }
});

export default router;
