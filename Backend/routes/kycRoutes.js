const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');

router.get('/offers/:key', kycController.getOfferByUuid);

router.post('/submit-application', kycController.submitApplication);

router.post('/send-email-otp', kycController.sendEmailOtp);
router.post('/verify-email-otp', kycController.verifyEmailOtp);
router.post('/send-bank-otp', kycController.sendBankOtp);
router.post('/verify-bank-otp', kycController.verifyBankOtp);
router.post('/verify-pan', kycController.verifyPan);
router.post('/verify-salary', kycController.verifySalarySlip); 
router.post('/verify-bank-details', kycController.verifyBankDetails);
router.get('/profile-image/:pan', kycController.getProfileImage);


module.exports = router;