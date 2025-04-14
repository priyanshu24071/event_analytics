const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./config');
const { User } = require('../db/models');

const setupGoogleStrategy = () => {
  passport.use(new GoogleStrategy({
    clientID: config.auth.googleClientId,
    clientSecret: config.auth.googleClientSecret,
    callbackURL: config.auth.googleCallbackUrl
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      const [user] = await User.findOrCreate({
        where: { googleId: profile.id },
        defaults: {
          email: profile.emails[0].value,
          name: profile.displayName
        }
      });
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
};

module.exports = { setupGoogleStrategy }; 