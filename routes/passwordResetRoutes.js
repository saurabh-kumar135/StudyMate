const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const { passwordResetLimiter } = require('../middleware/rateLimiter');

router.post('/request', passwordResetLimiter, passwordResetController.requestPasswordReset);
router.get('/validate/:token', passwordResetController.validateResetToken);
router.post('/reset', passwordResetLimiter, passwordResetController.resetPassword);

module.exports = router;
