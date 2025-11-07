const healthController = require('../controllers/healthController');
const authController = require('../controllers/authController');

const router = require('express').Router();

router.get('/health', healthController.getHealth);

// Auth routes
router.post('/auth/send-otp', authController.sendOTP.bind(authController));
router.post('/auth/verify-otp', authController.verifyOTP.bind(authController));

module.exports = router;

