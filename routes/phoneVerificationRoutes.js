const express = require('express');
const router = express.Router();
const phoneVerificationController = require('../controllers/phoneVerificationController');
const { otpLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', otpLimiter, phoneVerificationController.sendPhoneOTP);
router.post('/verify-otp', otpLimiter, phoneVerificationController.verifyPhoneOTP);
router.post('/resend-otp', otpLimiter, phoneVerificationController.resendPhoneOTP);

module.exports = router;

