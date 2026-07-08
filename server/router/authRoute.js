const express = require('express');
const router = express.Router();
const { registerController, loginController, UserLogin, UserRegister, AdminLogin, SendAdminOtp, VerifyAdminOtp } = require('../controller/authController');
const { saveSubscription } = require('../controller/notificationController');

router.post('/register', registerController);
router.post('/login', loginController);
// Route to Register User
router.post("/api/login", UserLogin);
// Router to Register New user By admin side
router.post("/api/register", UserRegister);

// Admin Routes
router.post("/api/admin-login", AdminLogin);
router.post("/api/send-admin-otp", SendAdminOtp);
router.post("/api/verify-admin-otp", VerifyAdminOtp);

// Push Notification Subscription
router.post("/api/save-subscription", saveSubscription);

module.exports = router;