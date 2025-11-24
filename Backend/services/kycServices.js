const db = require('../config/db');
const emailService = require('./emailService');
const otpStore = new Map();

const kycService = {
    sendOtp: async (identifier) => {
        if (identifier.includes('@')) {
            const otp = emailService.generateOtp();
            
            const emailResult = await emailService.sendVerificationEmail(identifier, otp);
            
            if (emailResult.success) {
                const expiry = Date.now() + 300000; 
                otpStore.set(identifier, { code: otp, expiry });
                console.log(`[KYC Service] Real OTP (${otp}) sent to ${identifier}`);
                return { success: true, message: 'OTP Sent to your email.' };
            } else {
                return { success: false, message: emailResult.message };
            }
        } else {
            const code = '654321';
            const expiry = Date.now() + 120000; 
            otpStore.set(identifier, { code, expiry });
            console.log(`[DUMMY OTP] OTP for ${identifier} is: ${code}`);
            return { success: true, message: 'OTP Sent (check console)' };
        }
    },

    verifyOtp: async (identifier, enteredCode) => {
        const record = otpStore.get(identifier);
        if (!record || Date.now() > record.expiry || record.code !== enteredCode) {
            console.log(`[KYC Service] OTP verification failed for ${identifier}.`);
            console.log(`Record: ${record ? JSON.stringify(record) : 'Not Found'}. Entered: ${enteredCode}`);
            return { success: false, message: 'Invalid or expired OTP.' };
        }
        otpStore.delete(identifier);
        return { success: true, message: 'OTP Verified Successfully.' };
    },

    getProfileImageUrl: async (pan) => {
        const sql = `SELECT profile_image_url FROM bank_accounts WHERE pan_number = ?`;
        try {
            const [rows] = await db.query(sql, [pan]);
            if (!rows || rows.length === 0) {
                return { success: false, message: 'No profile image record found for this PAN.' };
            }
            return { success: true, imageUrl: rows[0].profile_image_url };
        } catch (error) {
            console.error("Error in getProfileImageUrl:", error);
            return { success: false, message: 'Database error.' };
        }
    },

    verifyPan: async (pan, name) => {
        const sql = `SELECT full_name, DATE_FORMAT(dob, '%Y-%m-%d') AS dob, email, phone_number, address, profile_image_url FROM bank_accounts WHERE pan_number = ?`;
        try {
            const [rows] = await db.query(sql, [pan]);
            if (!rows || rows.length === 0) {
                return { success: false, message: 'PAN not found in our records.' };
            }
            const record = rows[0];
            const dbFirstName = record.full_name.split(' ')[0].toLowerCase();
            const inputFirstName = name.split(' ')[0].toLowerCase();

            if (dbFirstName === inputFirstName) {
                return {
                    success: true,
                    message: 'PAN verified successfully.',
                    verifiedData: {
                        name: record.full_name,
                        dob: record.dob,
                        email: record.email,
                        phone: record.phone_number,
                        address: record.address,
                        face_image_url: record.profile_image_url
                    }
                };
            } else {
                return { success: false, message: `Name mismatch. PAN record found for ${record.full_name}, but you entered ${name}.` };
            }
        } catch (error) {
            console.error("Error in verifyPan:", error);
            return { success: false, message: 'Database error during PAN verification.' };
        }
    },

    verifySalarySlip: async (
        dbPhone,
        dbAddress,
        loanAmount,
        extractedSalary,
        extractedPhone,
        extractedAddress
    ) => {
        
        const dbRecord = {
            phone_number: dbPhone,
            address: dbAddress
        };

        if (extractedPhone && dbRecord.phone_number !== extractedPhone) {
            console.warn(`Phone Mismatch: DB has ${dbRecord.phone_number}, Slip has ${extractedPhone}`);
            return {
                status: 'FAILED',
                message: `Phone Number Mismatch: Your registered phone (${dbRecord.phone_number}) does not match the phone on the salary slip (${extractedPhone}).`
            };
        }
        if (!extractedPhone) {
            console.warn("Could not extract phone from slip. Skipping phone check.");
        }

        if (extractedAddress && dbRecord.address) {
            const dbAddressSimple = dbRecord.address.toLowerCase().replace(/[^a-z0-9]/g, '');
            const extAddressSimple = extractedAddress.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (!dbAddressSimple.includes(extAddressSimple) && !extAddressSimple.includes(dbAddressSimple)) {
                console.warn(`Address Mismatch: DB has ${dbRecord.address}, Slip has ${extractedAddress}`);
            }
        }
        if (!extractedAddress) {
            console.warn("Could not extract address from slip. Skipping address check.");
        }

        const minSalaryDefault = 15000;

        if (loanAmount > 300000 && extractedSalary < 30000) {
            return {
                status: 'FAILED',
                message: `Salary Insufficient: Your salary of ₹${extractedSalary} does not meet the ₹30,000 requirement for a loan over ₹300,000.`
            };
        }

        if (loanAmount > 100000 && loanAmount <= 200000 && extractedSalary < 15000) {
            return {
                status: 'FAILED',
                message: `Salary Insufficient: Your salary of ₹${extractedSalary} does not meet the ₹15,000 requirement for this loan amount.`
            };
        }

        if (extractedSalary < minSalaryDefault) {
            return {
                status: 'FAILED',
                message: `Salary Insufficient: Your salary of ₹${extractedSalary} is below the minimum requirement of ₹${minSalaryDefault}.`
            };
        }

        return {
            status: 'VERIFIED',
            message: 'Salary Slip Verified.',
            verifiedSalary: extractedSalary,
            verifiedPhone: dbRecord.phone_number,
            verifiedAddress: dbRecord.address 
        };
    },

    verifyBankDetails: async ({ pan, accountNumber, ifscCode }) => {
        const sql = `SELECT account_number, ifsc_code FROM bank_accounts WHERE pan_number = ?`;
        try {
            const [rows] = await db.query(sql, [pan]);
            if (!rows || rows.length === 0) {
                return { success: false, message: 'PAN not found in records. Please verify PAN first.' };
            }
            const record = rows[0];

            if (record.account_number !== accountNumber) {
                return { success: false, message: 'Account Number does not match our records for this PAN.' };
            }
            if (record.ifsc_code.toUpperCase() !== ifscCode.toUpperCase()) {
                return { success: false, message: 'IFSC Code does not match our records for this PAN.' };
            }
            return { success: true, message: 'Bank details verified.' };

        } catch (error) {
            console.error("Error in verifyBankDetails:", error);
            return { success: false, message: 'Database error during bank detail verification.' };
        }
    },

    verifyFinalDetails: async (details) => {
        const { pan, email, phone, dob, accountNumber, ifscCode } = details;
        
        const sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') AS formatted_dob FROM bank_accounts WHERE pan_number = ?`;
        const [rows] = await db.query(sql, [pan]);

        if (!rows || rows.length === 0) {
            return { success: false, field: 'pan', message: 'PAN number not found in bank records. Please re-verify PAN.' };
        }
        
        const record = rows[0];
        
        if (record.email !== email) {
            return { success: false, field: 'email', message: `Email (${email}) does not match our records for this PAN.` };
        }
        if (record.phone_number !== phone) {
            return { success: false, field: 'phone', message: `Phone number (${phone}) does not match our records for this PAN.` };
        }
        
        const dbDob = record.formatted_dob;
        if (dbDob !== dob) {
            return { success: false, field: 'dob', message: `Date of Birth (${dob}) does not match our records (${dbDob}).` };
        }
        if (record.account_number !== accountNumber) {
            return { success: false, field: 'accountNumber', message: `Account Number does not match our records for this PAN.` };
        }
        if (record.ifsc_code.toUpperCase() !== ifscCode.toUpperCase()) {
            return { success: false, field: 'ifscCode', message: `IFSC Code does not match our records for this PAN.` };
        }

        return { success: true, message: 'All details verified successfully.' };
    }
};

module.exports = kycService;