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
  // Passport logout (clears req.user)
  try {
    req.logout?.(err => {
      if (err) return next(err);
      // Destroy session in store
      const oldSessionID = req.sessionID;
      if (req.session) {
        req.session.destroy(err2 => {
          if (err2) console.warn('[auth] session destroy error', err2);
          res.clearCookie(sidCookieName, { path: '/' });
          // Regenerate a fresh anonymous session to avoid reusing the old id
          req.session = null;
          req.sessionStore?.generate?.(req); // some stores expose helper
          return res.redirect('/home');
        });
      } else {
        res.clearCookie(sidCookieName, { path: '/' });
        return res.redirect('/home');
      }
    });
  } catch (e) {
    console.warn('[auth] logout exception', e);
    res.clearCookie('connect.sid', { path: '/' });
    return res.redirect('/home');
  }
});

export default router;
