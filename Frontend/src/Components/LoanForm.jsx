import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { createWorker } from 'tesseract.js';

import PersonalDetails from './PersonalDetails';
import GuarantorDetails from './GuarantorDetails';

// This is the main state object for the entire form
const INITIAL_FORM_DATA = {
    personal: {
        name: '',
        email: '',
        phone: '',
        dob: '',
        emailOtp: '',
        emailOtpSent: false,
        emailVerified: false,
        faceImage: null,
        faceVerified: false,
        faceReferenceUrl: '' // This will be filled by PersonalDetails
    },
    bank: {
        panCard: '',
        accountNumber: '',
        ifscCode: '',
        panVerified: false,
        bankOtp: '',
        bankOtpSent: false,
        bankVerified: false,
        dbAddress: ''
    },
    salary: {
        salarySlip: null,
        extractedSalary: '',
        extractedPhone: '',
        extractedAddress: '',
        verified: false
    },
    loan: {
        // Pre-filled from your PersonalDetails component logic
        amount: '50000',
        interestRate: '12',
        tenure: '12 Months',
        verified: true 
    },
    guarantor: {
        name: '',
        relationship: '',
        gender: '',
        dob: '',
        phone: '',
        otp: '',
        otpSent: false,
        phoneVerified: false,
        documentImage: null,
        faceImage: null,
        faceVerified: false
    }
};

const LoanForm = () => {
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [mainStep, setMainStep] = useState(1); // 1 = Personal, 2 = Guarantor
    
    // Child component validity
    const [isPersonalValid, setIsPersonalValid] = useState(false);
    const [isGuarantorValid, setIsGuarantorValid] = useState(false);

    // Model loading states
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceApiReady, setFaceApiReady] = useState(false);
    const [tesseractReady, setTesseractReady] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading AI models...');

    // Load all AI models on component mount
    useEffect(() => {
        const loadAllModels = async () => {
            const tesseractWorker = await createWorker();
            
            const loadFaceApi = async () => {
                setLoadingMessage('Loading face models...');
                await Promise.all([
                    faceapi.loadTinyFaceDetectorModel('/models'),
                    faceapi.loadFaceLandmarkModel('/models'),
                    faceapi.loadFaceRecognitionModel('/models'),
                ]);
                setModelsLoaded(true);
                setFaceApiReady(true);
                window.faceapi = faceapi; // Make it globally available for child components
            };

            const loadTesseract = async () => {
                setLoadingMessage('Loading text recognition (OCR)...');
                await tesseractWorker.load();
                await tesseractWorker.loadLanguage('eng');
                await tesseractWorker.initialize('eng');
                window.Tesseract = tesseractWorker; // Make it globally available
                setTesseractReady(true);
            };

            try {
                await Promise.all([loadFaceApi(), loadTesseract()]);
                setLoadingMessage('All models loaded!');
            } catch (err) {
                console.error("Model loading failed:", err);
                setLoadingMessage('Error loading AI models. Please refresh.');
            }
        };

        loadAllModels();

        return () => {
            // Cleanup tesseract worker
            if (window.Tesseract) {
                window.Tesseract.terminate();
            }
        };
    }, []);

    // A single update function to manage the complex state
    const updateField = useCallback((section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    }, []);

    // Main navigation
    const handleNextMainStep = () => {
        if (mainStep === 1 && isPersonalValid) {
            setMainStep(2);
        }
    };

    const handlePrevMainStep = () => {
        if (mainStep === 2) {
            setMainStep(1);
        }
    };

    // Check if the entire form is ready for submission
    const isFormSubmittable = useMemo(() => {
        return isPersonalValid && isGuarantorValid;
    }, [isPersonalValid, isGuarantorValid]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormSubmittable) {
            console.log("FORM SUBMITTED:", JSON.stringify(formData, null, 2));
            alert("Loan Application Submitted Successfully!");
            // Here you would send 'formData' to your backend API
        } else {
            alert("Please complete all required steps.");
        }
    };

    // Loading overlay
    if (!modelsLoaded || !tesseractReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                    <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-700">{loadingMessage}</h2>
                    <p className="text-gray-500">This may take a moment...</p>
                </div>
            </div>
        );
    }

    // Main Form JSX
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-white shadow-2xl rounded-lg my-10">
            <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">SmartFinance Loan Application</h1>
            
            {/* Main Step Progress Bar */}
            <div className="flex items-center justify-center space-x-4 mb-10">
                <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${mainStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                        {mainStep === 2 ? '✓' : '1'}
                    </div>
                    <span className={`text-sm mt-2 font-semibold ${mainStep === 1 ? 'text-blue-600' : 'text-gray-500'}`}>Personal Details</span>
                </div>
                <div className={`flex-1 h-1.5 ${mainStep > 1 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${mainStep === 2 ? (isGuarantorValid ? 'bg-green-600 text-white' : 'bg-blue-600 text-white') : 'bg-gray-300 text-gray-600'}`}>
                        {isGuarantorValid ? '✓' : '2'}
                    </div>
                    <span className={`text-sm mt-2 font-semibold ${mainStep === 2 ? 'text-blue-600' : 'text-gray-500'}`}>Guarantor</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {mainStep === 1 && (
                    <PersonalDetails
                        formData={formData}
                        updateField={updateField}
                        setValid={setIsPersonalValid}
                        tesseractReady={tesseractReady}
                        faceApiReady={faceApiReady}
                        modelsLoaded={modelsLoaded}
                    />
                )}

                {mainStep === 2 && (
                    <GuarantorDetails
                        formData={formData.guarantor}
                        updateField={updateField}
                        setValid={setIsGuarantorValid}
                        faceApiReady={faceApiReady}
                        modelsLoaded={modelsLoaded}
                        applicantFaceReferenceUrl={formData.personal.faceReferenceUrl}
                    />
                )}

                <div className="mt-12 pt-8 border-t-2 border-gray-200">
                    {mainStep === 1 && (
                        <button 
                            type="button" 
                            onClick={handleNextMainStep}
                            disabled={!isPersonalValid}
                            className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold disabled:bg-gray-400"
                        >
                            Next: Guarantor Details
                        </button>
                    )}
                    
                    {mainStep === 2 && (
                        <div className="flex justify-between items-center">
                            <button 
                                type="button" 
                                onClick={handlePrevMainStep}
                                className="bg-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold"
                            >
                                Previous
                            </button>
                            <button 
                                type="submit"
                                disabled={!isFormSubmittable}
                                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold disabled:bg-gray-400"
                            >
                                Submit Loan Application
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default LoanForm;