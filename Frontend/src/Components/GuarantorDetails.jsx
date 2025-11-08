import React, { useState, useMemo, useEffect } from 'react';
import FormInput from './FormInput';
import GuarantorFaceMatch from './GuarantorFaceMatch'; // <-- Make sure this is imported

// Helper function to calculate age
const getAge = (dateString) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// Dummy OTP for this component
const DUMMY_GUARANTOR_OTP = '123456';

const GuarantorDetails = ({ 
    formData, 
    // applicantFaceImage, // <-- REMOVED this prop
    updateField, 
    setValid, 
    faceApiReady, 
    modelsLoaded 
}) => {
    const [subStep, setSubStep] = useState(1);
    const [otpTimer, setOtpTimer] = useState(0);
    const [dobError, setDobError] = useState(null);

    // Timer logic for OTP
    useEffect(() => {
        if (otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [otpTimer]);

    // Validation for Step 1
    const isStep1Valid = useMemo(() => {
        const age = getAge(formData.dob);
        const isDobValid = age >= 25;
        return (
            formData.name &&
            formData.phone &&
            formData.phoneVerified &&
            formData.relationship &&
            formData.gender &&
            formData.dob &&
            isDobValid
        );
    }, [formData]);

    // Validation for Step 2
    const isStep2Valid = useMemo(() => {
        return formData.faceVerified;
    }, [formData.faceVerified]);

    // Update overall form validity
    useEffect(() => {
        setValid(isStep1Valid && isStep2Valid);
    }, [isStep1Valid, isStep2Valid, setValid]);

    // --- Step 1 Handlers ---

    const handleDobChange = (e) => {
        const newDob = e.target.value;
        updateField('guarantor', 'dob', newDob);
        const age = getAge(newDob);
        if (age < 25) {
            setDobError('Guarantor must be at least 25 years old.');
        } else {
            setDobError(null);
        }
    };

    const handleSendOtp = () => {
        if (formData.phone && formData.phone.length === 10) {
            alert(`Dummy OTP sent to ${formData.phone}: ${DUMMY_GUARANTOR_OTP}`);
            updateField('guarantor', 'otpSent', true);
            setOtpTimer(60);
        } else {
            alert('Please enter a valid 10-digit phone number.');
        }
    };

    const handleVerifyOtp = () => {
        if (formData.otp === DUMMY_GUARANTOR_OTP) {
            alert('Guarantor phone number verified!');
            updateField('guarantor', 'phoneVerified', true);
            updateField('guarantor', 'otpSent', false);
        } else {
            alert('Invalid OTP. Please try again.');
        }
    };

    // --- Navigation ---
    const handleNextSubStep = () => {
        if (subStep === 1 && isStep1Valid) setSubStep(2);
    };

    const handlePrevSubStep = () => {
        if (subStep === 2) setSubStep(1);
    };

    // --- Render Functions ---

    const renderStep1 = () => (
        <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-700">Step 1: Guarantor Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                    label="Guarantor's Full Name"
                    value={formData.name || ''} 
                    onChange={(e) => updateField('guarantor', 'name', e.target.value)}
                    placeholder="Full Name"
                    required
                />
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700">Relationship to Applicant</label>
                    <select
                        value={formData.relationship || ''} 
                        onChange={(e) => updateField('guarantor', 'relationship', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Select Relationship...</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Colleague">Colleague</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                        value={formData.gender || ''} 
                        onChange={(e) => updateField('guarantor', 'gender', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Select Gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <FormInput
                    label="Date of Birth"
                    value={formData.dob || ''} 
                    onChange={handleDobChange}
                    type="date"
                    required
                    error={dobError}
                />
            </div>
            <div className="space-y-4">
                <FormInput
                    label="Guarantor's Phone"
                    value={formData.phone || ''} 
                    onChange={(e) => updateField('guarantor', 'phone', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10-digit mobile"
                    type="tel"
                    maxLength="10"
                    required
                    disabled={formData.phoneVerified}
                />
                {!formData.phoneVerified && (
                    <div className="space-y-4">
                        <button onClick={handleSendOtp} disabled={otpTimer > 0 || !formData.phone || formData.phone.length !== 10} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                            {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Send OTP'}
                        </button>
                        {formData.otpSent && (
                            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                                <FormInput 
                                    label="Enter OTP" 
                                    value={formData.otp || ''} 
                                    onChange={(e) => updateField('guarantor', 'otp', e.target.value)} 
                                    placeholder="Enter 6-digit OTP" 
                                    type="text" 
                                    maxLength="6" 
                                />
                                <button onClick={handleVerifyOtp} className="bg-green-600 text-white px-4 py-2 rounded-lg sm:self-end h-12">
                                    Verify OTP
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {formData.phoneVerified && <p className="text-green-600 font-semibold">✅ Guarantor phone verified!</p>}
            </div>
        </div>
    );

    // --- RENDER STEP 2 IS NOW UPDATED ---
    const renderStep2 = () => (
        <GuarantorFaceMatch
            formData={formData}
            // applicantFaceImage={applicantFaceImage} // <-- REMOVED
            updateField={updateField}
            faceApiReady={faceApiReady}
            modelsLoaded={modelsLoaded}
        />
    );

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-3">2. Guarantor Details</h3>
            
            {/* --- Sub-step Progress Bar --- */}
            <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${subStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                        {subStep === 2 ? '✓' : '1'}
                    </div>
                    <span className={`text-xs mt-2 font-semibold ${subStep === 1 ? 'text-blue-600' : 'text-gray-500'}`}>Info</span>
                </div>
                <div className={`flex-1 h-1 ${subStep > 1 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${subStep === 2 ? (isStep2Valid ? 'bg-green-600 text-white' : 'bg-blue-600 text-white') : 'bg-gray-300 text-gray-600'}`}>
                        {isStep2Valid ? '✓' : '2'}
                    </div>
                    <span className={`text-xs mt-2 font-semibold ${subStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>Face</span>
                </div>
            </div>

            <div className="min-h-[350px]">
                {subStep === 1 ? renderStep1() : renderStep2()}
            </div>

            <div className="flex justify-between">
                <button onClick={handlePrevSubStep} disabled={subStep === 1} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50">
                    Previous
                </button>
                <button onClick={handleNextSubStep} disabled={!isStep1Valid || subStep === 2} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                    Next
                </button>
            </div>
        </div>
    );
};

export default GuarantorDetails;