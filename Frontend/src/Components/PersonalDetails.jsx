import React, { useState, useMemo, useEffect, useCallback } from 'react';
import FormInput from './FormInput';
import FaceMatch from './FaceMatch';

const API_URL = 'http://localhost:5002/api';

const PersonalDetails = ({ formData, updateField, setValid, tesseractReady, faceApiReady, modelsLoaded }) => { 
    const [subStep, setSubStep] = useState(1);
    const [otpTimer, setOtpTimer] = useState(0);
    const [bankOtpTimer, setBankOtpTimer] = useState(0);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState(null);
    
    const totalSubSteps = 5;

    useEffect(() => {
        if (otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpTimer]);

    useEffect(() => {
        if (bankOtpTimer > 0) {
            const timer = setTimeout(() => setBankOtpTimer(bankOtpTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [bankOtpTimer]);

    const isSubStepValid = useMemo(() => {
        if (subStep === 1) {
            return formData.personal.emailVerified;
        } else if (subStep === 2) {
            return formData.bank.panVerified && formData.bank.bankVerified;
        } else if (subStep === 3) {
            return formData.salary.verified;
        } else if (subStep === 4) {
            return formData.loan.verified; 
        } else if (subStep === 5) {
            return formData.personal.faceVerified;
        }
        return false;
    }, [formData, subStep]);

    const isAllStepsComplete = useMemo(() => {
        return (
            formData.personal.emailVerified &&
            formData.bank.panVerified &&
            formData.bank.bankVerified &&
            formData.salary.verified &&
            formData.loan.verified &&
            formData.personal.faceVerified
        );
    }, [
        formData.personal.emailVerified,
        formData.personal.faceVerified,
        formData.bank.panVerified,
        formData.bank.bankVerified,
        formData.salary.verified,
        formData.loan.verified
    ]);

    useEffect(() => {
        setValid(isAllStepsComplete);
    }, [isAllStepsComplete, setValid]);

    const handleSendEmailOtp = async () => {
        try {
            const response = await fetch(`${API_URL}/send-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.personal.email })
            });
            const data = await response.json();
            if (data.success) {
                alert('OTP sent to your email. Please check your inbox.'); 
                updateField('personal', 'emailOtpSent', true);
                setOtpTimer(60);
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert(`Failed to send OTP: ${error.message}`);
        }
    };

    const handleVerifyEmailOtp = async () => {
        try {
            const response = await fetch(`${API_URL}/verify-email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.personal.email, otp: formData.personal.emailOtp })
            });
            const data = await response.json();
            if (data.success) {
                updateField('personal', 'emailVerified', true);
                alert('Email verified successfully!');
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert(`Failed to verify OTP: ${error.message}`);
        }
    };

    const handlePanVerification = useCallback(async () => {
        if (!formData.personal.name) {
            alert("Please enter your Full Name first, as it appears on your PAN card.");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/verify-pan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pan: formData.bank.panCard, name: formData.personal.name }) 
            });
            const data = await response.json();
            if (data.success) {
                updateField('bank', 'panVerified', true);
                alert('PAN verified successfully!');
                
                if(data.verifiedData) {
                    alert("We found your details in our records and have pre-filled them for you.");
                    updateField('personal', 'name', data.verifiedData.name);
                    updateField('personal', 'email', data.verifiedData.email);
                    updateField('personal', 'dob', data.verifiedData.dob);
                    updateField('personal', 'phone', data.verifiedData.phone);
                    updateField('bank', 'dbAddress', data.verifiedData.address);
                    updateField('personal', 'faceReferenceUrl', data.verifiedData.face_image_url);
                }
            } else {
                alert(`PAN Verification Failed: ${data.message}`);
            }
        } catch (error) {
            alert(`Failed to verify PAN: ${error.message}`);
        }
    }, [formData.personal.name, formData.bank.panCard, updateField]);

    useEffect(() => {
        if (formData.bank.panCard && formData.personal.name && !formData.bank.panVerified) {
            
            const handler = setTimeout(() => {
                if (formData.bank.panCard && formData.personal.name && !formData.bank.panVerified) {
                    console.log("Auto-triggering PAN verification...");
                    handlePanVerification();
                }
            }, 1000); 

            return () => {
                clearTimeout(handler); 
            };
        }
    }, [formData.personal.name, formData.bank.panCard, formData.bank.panVerified, handlePanVerification]); 
    
    
    const extractPan = (text) => {
        const panRegex = /[A-Z]{5}[A-Z0-9]{4}[A-Z]{1}/;
        const match = text.match(panRegex);
        return match ? match[0] : null;
    };

    const extractSalary = (text) => {
        const salaryRegex = /(?:Net Salary|Net Pay|TAKE HOME PAY|NET PAYABLE)[\s:.-]*([\d,]+\.?\d*)/i;
        const match = text.match(salaryRegex);
        if (match && match[1]) {
            return match[1].replace(/,/g, '');
        }
         const fallbackRegex = /Net Pay\s+([\d,]+\.?\d*)/i;
         const fallbackMatch = text.match(fallbackRegex);
         if (fallbackMatch && fallbackMatch[1]) {
            return fallbackMatch[1].replace(/,/g, '');
         }
        return null;
    };

    const extractPhone = (text) => {
        const phoneRegex = /(?:\+91[\s-]*)?([6-9]\d{9})(?!\d)/;
        const match = text.match(phoneRegex);
        return match ? match[1] : null; 
    };
    
    const extractAddress = (text) => {
        const addressRegex = /Address\s*[:\n-]([\s\S]*?)(?:\n\n|Phone|Email|PAN)/i;
        const match = text.match(addressRegex);
        if (match && match[1]) {
            return match[1].replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return null;
    };

    const extractName = (text) => {
      const regex = /Name\s*[:\n-]([\s\S]*?)(?:\n)/i;
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };
   
    const extractDob = (text) => {
      const regex = /DOB\s*[:\n-]([\d]{4}-[\d]{2}-[\d]{2})/i;
      const match = text.match(regex);
      return match ? match[1].trim() : null;
    };


    const handleSalaryVerification = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        updateField('salary', 'salarySlip', file);
        setOcrError(null); 

        if (!tesseractReady || !window.Tesseract) {
             alert("OCR library is still loading. Please try again in a moment.");
             e.target.value = null;
             updateField('salary', 'salarySlip', null);
             return;
        }

        if (!formData.bank.panVerified) {
            alert("Please verify your PAN before verifying salary.");
            e.target.value = null;
            updateField('salary', 'salarySlip', null);
            return;
        }
        
        if (!formData.bank.bankVerified) {
            alert("Please verify your Bank Account first. We need to cross-check your phone and address.");
             e.target.value = null;
            updateField('salary', 'salarySlip', null);
            return;
        }

        setIsOcrLoading(true);

        try {
            const { data: { text } } = await window.Tesseract.recognize(
                file, 'eng', { logger: m => console.log(m) }
            );

            console.log("--- Extracted OCR Text ---");
            console.log(text);
            console.log("--------------------------");
            
            const extractedSalary = extractSalary(text);
            const extractedPhone = extractPhone(text);
            const extractedAddress = extractAddress(text);
            
            if (!extractedSalary) {
                throw new Error("Could not read Net Salary from the slip. Please upload a clearer document.");
            }
            if (!extractedPhone) {
                 console.warn("Could not extract phone from slip. Proceeding without it.");
            }
             if (!extractedAddress) {
                 console.warn("Could not extract address from slip. Proceeding without it.");
            }
            
            console.log("Extracted Salary:", extractedSalary);
            console.log("Extracted Phone:", extractedPhone);
            console.log("Extracted Address:", extractedAddress);

            const response = await fetch(`${API_URL}/verify-salary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    dbPhone: formData.personal.phone,
                    dbAddress: formData.bank.dbAddress,
                    loanAmount: formData.loan.amount,
                    extractedSalary: extractedSalary,
                    extractedPhone: extractedPhone,
                    extractedAddress: extractedAddress
                }) 
            });
            
            const data = await response.json();
            
            if (data.status === 'VERIFIED') {
                updateField('salary', 'extractedSalary', data.verifiedSalary);
                updateField('salary', 'extractedAddress', data.verifiedAddress);
                updateField('salary', 'extractedPhone', data.verifiedPhone);
                updateField('salary', 'verified', true);
                alert(`Salary slip verified! Salary: ₹${data.verifiedSalary}. Details matched.`);
            } else {
                throw new Error(data.message || "Salary Verification Failed.");
            }

        } catch (error) {
            setOcrError(error.message); 
            alert(`Salary Verification Failed: ${error.message}`);
            e.target.value = null;
            updateField('salary', 'salarySlip', null);
            updateField('salary', 'extractedSalary', '');
            updateField('salary', 'extractedAddress', '');
            updateField('salary', 'extractedPhone', '');
        } finally {
            setIsOcrLoading(false); 
        }
    };


    // --- THIS IS THE UPDATED FUNCTION ---
    const handleSendBankOtp = async () => {
        try {
            // Step 1: Verify bank details first
            const verifyResponse = await fetch(`${API_URL}/verify-bank-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pan: formData.bank.panCard,
                    accountNumber: formData.bank.accountNumber,
                    ifscCode: formData.bank.ifscCode
                })
            });

            const verifyData = await verifyResponse.json();
            
            // If verification fails, show the specific error and STOP
            if (!verifyData.success) {
                alert(`Bank Verification Failed: ${verifyData.message}`);
                return; // Don't proceed to send OTP
            }

            // Step 2: If details are correct, proceed to send the (dummy) OTP
            const otpResponse = await fetch(`${API_URL}/send-bank-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.personal.phone })
            });

            const otpData = await otpResponse.json();
            if (otpData.success) {
                // Update alert message to confirm details are verified
                alert('Bank details verified! OTP sent to your registered phone! (Check backend console for code: 654321)');
                updateField('bank', 'bankOtpSent', true);
                setBankOtpTimer(60);
            } else {
                alert(`Error sending OTP: ${otpData.message}`);
            }

        } catch (error) {
            alert(`Failed to verify bank details: ${error.message}`);
        }
    };
    // --- END OF UPDATED FUNCTION ---

    const handleVerifyBankOtp = async () => {
         try {
            const response = await fetch(`${API_URL}/verify-bank-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: formData.personal.phone, otp: formData.bank.bankOtp })
            });
            const data = await response.json();
            if (data.success) {
                updateField('bank', 'bankVerified', true);
                alert('Bank account verified successfully!');
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert(`Failed to verify bank OTP: ${error.message}`);
        }
    };

    const handleNextSubStep = () => {
        if (isSubStepValid && subStep < totalSubSteps) {
            setSubStep(subStep + 1);
        }
    };

    const handlePrevSubStep = () => {
        if (subStep > 1) {
            setSubStep(subStep - 1);
        }
    };

    const renderSubStep = () => {
        switch (subStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-gray-700">1. Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput label="Full Name" value={formData.personal.name} onChange={(e) => updateField('personal', 'name', e.target.value)} placeholder="As per PAN card" required />
                            <FormInput label="Email Address" value={formData.personal.email} onChange={(e) => updateField('personal', 'email', e.target.value)} placeholder="name@example.com" type="email" required />
                            <FormInput label="Phone Number" value={formData.personal.phone} onChange={(e) => updateField('personal', 'phone', e.target.value.replace(/[^0-9]/g, ''))} placeholder="10-digit mobile" type="tel" maxLength="10" required />
                            <FormInput label="Date of Birth" value={formData.personal.dob} onChange={(e) => updateField('personal', 'dob', e.target.value)} type="date" required />
                        </div>
                        {!formData.personal.emailVerified && (
                            <div className="space-y-4">
                                <button onClick={handleSendEmailOtp} disabled={otpTimer > 0 || !formData.personal.email.includes('@')} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                                    {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Send OTP to Email'}
                                </button>
                                {formData.personal.emailOtpSent && (
                                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                                        <FormInput label="Enter OTP" value={formData.personal.emailOtp} onChange={(e) => updateField('personal', 'emailOtp', e.target.value)} placeholder="Enter 6-digit OTP" type="text" maxLength="6" />
                                        <button onClick={handleVerifyEmailOtp} className="bg-green-600 text-white px-4 py-2 rounded-lg sm:self-end h-12">
                                            Verify OTP
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {formData.personal.emailVerified && <p className="text-green-600 font-semibold">✅ Email verified successfully!</p>}
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-gray-700">2. Bank & PAN Verification</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <FormInput 
                                label="PAN Card Number" 
                                value={formData.bank.panCard} 
                                onChange={(e) => updateField('bank', 'panCard', e.target.value.toUpperCase())} 
                                placeholder="Enter PAN number" 
                                type="text" 
                                maxLength="10" 
                                required 
                                disabled={true} 
                                className={'bg-gray-100 cursor-not-allowed'}
                            />
                        </div>
                        
                        {formData.bank.panVerified && <p className="text-green-600 font-semibold">✅ PAN verified successfully!</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                           <FormInput label="Account Number" value={formData.bank.accountNumber} onChange={(e) => updateField('bank', 'accountNumber', e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter account number" type="text" maxLength="18" required />
                           <FormInput label="IFSC Code" value={formData.bank.ifscCode} onChange={(e) => updateField('bank', 'ifscCode', e.target.value.toUpperCase())} placeholder="e.g., SBIN0001234" type="text" maxLength="11" required />
                        </div>
                        
                        {!formData.bank.bankVerified && (
                            <div className="space-y-4">
                                <button onClick={handleSendBankOtp} disabled={bankOtpTimer > 0 || !formData.bank.accountNumber || !formData.bank.ifscCode || !formData.personal.phone} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                                    {bankOtpTimer > 0 ? `Resend OTP in ${bankOtpTimer}s` : 'Send OTP for Bank Verification'}
                                </button>
                                {formData.bank.bankOtpSent && (
                                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                                        <FormInput label="Enter Bank OTP" value={formData.bank.bankOtp} onChange={(e) => updateField('bank', 'bankOtp', e.target.value)} placeholder="Enter 6-digit OTP" type="text" maxLength="6" />
                                        <button onClick={handleVerifyBankOtp} className="bg-green-600 text-white px-4 py-2 rounded-lg sm:self-end h-12">
                                            Verify Bank OTP
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {formData.bank.bankVerified && <p className="text-green-600 font-semibold">✅ Bank account verified successfully!</p>}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-gray-700">3. Salary Slip Verification</h4>
                        <p className="text-sm text-gray-600">Please upload your latest salary slip. We will read it to verify your Net Salary, Phone, and Address against your bank records.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Upload Salary Slip</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.png,.jpeg" 
                                onChange={handleSalaryVerification}
                                disabled={isOcrLoading || !tesseractReady}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                            />
                        </div>

                        {!tesseractReady && (
                            <div className="flex items-center space-x-3 p-4 bg-blue-100 border border-blue-300 rounded-lg">
                                <span className="text-blue-800 font-medium">Loading OCR service...</span>
                            </div>
                        )}

                        {isOcrLoading && (
                            <div className="flex items-center space-x-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-yellow-800 font-medium">Processing your salary slip... This may take a moment.</span>
                            </div>
                        )}
                        {ocrError && (
                            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                                <p className="text-red-700 font-semibold">Error: {ocrError}</p>
                            </div>
                        )}

                        {formData.salary.verified && (
                            <div className="space-y-4 p-4 bg-green-100 rounded-lg">
                                <p><strong>File:</strong> {formData.salary.salarySlip?.name}</p>
                                <p><strong>Verified Salary:</strong> ₹{parseFloat(formData.salary.extractedSalary).toLocaleString()}</p>
                                <p><strong>Verified Phone:</strong> {formData.salary.extractedPhone || 'N/A'}</p>
                                <p><strong>Verified Address:</strong> {formData.salary.extractedAddress || 'N/A'}</p>
                                <p className="text-green-700 font-semibold">✅ Salary slip verified successfully!</p>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-gray-700">4. Loan Details (Confirmed)</h4>
                        <p>Your pre-approved loan offer is shown below and in the summary box. These details are locked based on your chat.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput 
                                label="Loan Amount (₹)" 
                                value={formData.loan.amount ? `₹ ${parseFloat(formData.loan.amount).toLocaleString()}` : ''} 
                                readOnly 
                                className="bg-gray-100 cursor-not-allowed" 
                            />
                            <FormInput 
                                label="Interest Rate (p.a.)" 
                                value={formData.loan.interestRate ? `${formData.loan.interestRate} %` : ''} 
                                readOnly 
                                className="bg-gray-100 cursor-not-allowed" 
                            />
                            <FormInput 
                                label="Loan Tenure" 
                                value={formData.loan.tenure || ''} 
                                readOnly 
                                className="bg-gray-100 cursor-not-allowed" 
                            />
                        </div>
                        <p className="text-green-600 font-semibold">✅ Loan details confirmed from your offer.</p>
                    </div>
                );
            case 5:
                return (
                    <FaceMatch
                        updateField={updateField}
                        verified={formData.personal.faceVerified}
                        faceImage={formData.personal.faceImage}
                        faceApiReady={faceApiReady}
                        pan={formData.bank.panCard}
                        modelsLoaded={modelsLoaded}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-3">1. Personal & Verification Details</h3>
            <div className="flex justify-center mb-6">
                <div className="flex flex-wrap items-center justify-center space-x-1 sm:space-x-2">
                        {['Info', 'Bank', 'Salary', 'Amount', 'Face'].map((name, index) => {
                            const num = index + 1;
                            const isActive = subStep === num;
                            const isCompleted = subStep > num;
                            return (
                                <React.Fragment key={num}>
                                    <div className={`flex flex-col items-center p-2 ${isActive ? 'scale-110' : ''} ${isCompleted ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-50'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                            {isCompleted ? '✓' : num}
                                        </div>
                                        <span className={`text-xs mt-2 font-semibold text-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{name}</span>
                                    </div>
                                    {num < totalSubSteps && <div className={`flex-1 h-1 w-4 sm:w-8 ${subStep > num ? 'bg-green-600' : 'bg-gray-300'}`}></div>}
                                </React.Fragment>
                            );
                        })}
                </div>
            </div>
            <div className="min-h-[350px]">
                {renderSubStep()}
            </div>
            <div className="flex justify-between">
                <button onClick={handlePrevSubStep} disabled={subStep === 1} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50">
                    Previous
                </button>
                <button onClick={handleNextSubStep} disabled={!isSubStepValid || subStep === totalSubSteps} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                    {subStep === totalSubSteps ? 'Personal Details Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default PersonalDetails;