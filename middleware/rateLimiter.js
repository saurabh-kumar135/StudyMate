const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    errors: ['Too many verification requests. Please try again in 15 minutes.']
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    errors: ['Too many requests. Please try again later.']
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    errors: ['Too many authentication attempts. Please try again in 1 hour.']
  },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    errors: ['Too many password reset requests. Please try again in 1 hour.']
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  otpLimiter,
  apiLimiter,
  authLimiter,
  passwordResetLimiter
};
