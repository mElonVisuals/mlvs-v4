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
  req.logout?.(err => {
    if (err) return next(err);
    req.session?.destroy(()=>{
      res.redirect('/home');
    });
  });
});

export default router;
