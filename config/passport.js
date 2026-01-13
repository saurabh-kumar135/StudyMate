const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.profilePicture = profile.photos[0]?.value;
          await user.save();
          return done(null, user);
        }

        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          authProvider: 'google',
          profilePicture: profile.photos[0]?.value,
          emailVerified: true, 
          userType: 'guest' 
        });

        await newUser.save();
        done(null, newUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
