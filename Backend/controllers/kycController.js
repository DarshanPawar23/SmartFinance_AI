const offerModel = require('../models/offerModel');
const applicationModel = require('../models/applicationModel');
const kycService = require('../services/kycServices');

const getOfferByUuid = async (req, res) => {
    try {
        const offerKey = req.params.key;
        if (!offerKey || offerKey.length !== 36) {
            return res.status(400).json({ error: 'Invalid offer key format.' });
        }
        const offerData = await offerModel.getOfferByKey(offerKey);
        if (!offerData) {
            return res.status(404).json({ error: 'Offer not found or has expired.' });
        }
        res.json({
            loanAmount: offerData.loan_amount,
            interestRate: offerData.interest_rate,
            tenureMonths: offerData.tenure_months,
            isExisting: offerData.is_existing_customer,
            pan: offerData.pan_from_chat,
            phone: offerData.phone_from_chat,
        });
    } catch (error) {
        console.error("Error fetching offer data:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

const submitApplication = async (req, res) => {
    try {
        const { offerKey, formData, loanDetails } = req.body;
        if (!offerKey || !formData || !loanDetails) {
            return res.status(400).json({ error: 'Missing application data or offer key.' });
        }
        const newApplicationId = await applicationModel.createApplication(offerKey, formData, loanDetails);
        res.status(201).json({ success: true, message: 'Application submitted.', applicationId: newApplicationId });
    } catch (error) {
       console.error("Error submitting application:", error);
       res.status(500).json({ error: 'Failed to save application.' });
    }
};

const getProfileImage = async (req, res) => {
    try {
        const { pan } = req.params;
        if (!pan) {
            return res.status(400).json({ success: false, message: 'PAN is required.' });
        }
        const result = await kycService.getProfileImageUrl(pan);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const sendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
        const result = await kycService.sendOtp(email);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const verifyEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        const result = await kycService.verifyOtp(email, otp);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const sendBankOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone is required.' });
        const result = await kycService.sendOtp(phone);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const verifyBankOtp = async (req, res) => {
     try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
        const result = await kycService.verifyOtp(phone, otp);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const verifyPan = async (req, res) => {
    try {
        const { pan, name } = req.body;
        if (!pan || !name) return res.status(400).json({ success: false, message: 'PAN and Name are required.' });
        const result = await kycService.verifyPan(pan, name);
        res.json(result);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const verifySalarySlip = async (req, res) => {
    try {
        const {
            dbPhone, 
            dbAddress,
            loanAmount,
            extractedSalary, 
            extractedPhone, 
            extractedAddress
        } = req.body;

        if (!dbPhone || !dbAddress || !loanAmount || !extractedSalary) {
            return res.status(400).json({ status: 'FAILED', message: 'Missing required fields (dbPhone, dbAddress, loanAmount, extractedSalary).' });
        }

        const result = await kycService.verifySalarySlip(
            dbPhone,
            dbAddress,
            parseFloat(loanAmount),
            parseFloat(extractedSalary.replace(/,/g, '')),
            extractedPhone,
            extractedAddress
        );

        res.json(result);

    } catch (error) {
        console.error("Error in verifySalarySlip controller:", error);
        res.status(500).json({ status: 'FAILED', message: error.message });
    }
};

// ... (at the end of the file, before module.exports)

const verifyBankDetails = async (req, res) => {
    try {
        const { pan, accountNumber, ifscCode } = req.body;
        if (!pan || !accountNumber || !ifscCode) {
            return res.status(400).json({ success: false, message: 'PAN, Account Number, and IFSC are required.' });
        }
        // Call the new service function
        const result = await kycService.verifyBankDetails({ pan, accountNumber, ifscCode });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- UPDATE YOUR EXPORTS ---
module.exports = { 
    getOfferByUuid, 
    submitApplication,
    sendEmailOtp,
    verifyEmailOtp,
    sendBankOtp,
    verifyBankOtp,
    verifyPan,
    verifySalarySlip,
    getProfileImage,
    verifyBankDetails 
};