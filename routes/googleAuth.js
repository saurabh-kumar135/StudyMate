const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure'
  }),
  (req, res) => {
    
    req.session.isLoggedIn = true;
    req.session.user = req.user;

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/google/success`);
  }
);

router.get('/google/success', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        userType: req.user.userType,
        profilePicture: req.user.profilePicture,
        authProvider: req.user.authProvider
      }
    });
  } else {
    res.status(401).json({
      success: false,
      errors: ['Not authenticated']
    });
  }
});

router.get('/google/failure', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
});

module.exports = router;
