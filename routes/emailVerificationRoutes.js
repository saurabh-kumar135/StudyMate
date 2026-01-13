const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerificationController');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', otpLimiter, emailVerificationController.sendOTP);
router.post('/verify-otp', otpLimiter, emailVerificationController.verifyOTP);
router.post('/resend-otp', otpLimiter, emailVerificationController.resendOTP);

module.exports = router;
