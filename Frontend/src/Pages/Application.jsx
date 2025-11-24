import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; 
import PersonalDetails from '../Components/PersonalDetails';
import GuarantorDetails from '../Components/GuarantorDetails';
import FinalConfirmation from '../Components/FinalConfirmation';

const API_URL = 'http://localhost:5002/api';

const initialFormData = {
    personal: {
        name: '', email: '', dob: '', phone: '',
        emailOtp: '', emailOtpSent: false, emailVerified: false,
        faceImage: null, faceVerified: false,
        faceReferenceUrl: ''
    },
    bank: {
        accountNumber: '', ifscCode: '',
        bankOtp: '', bankOtpSent: false, bankVerified: false,
        panCard: '', panVerified: false,
        dbAddress: ''
    },
    salary: {
        salarySlip: null, 
        extractedSalary: '', 
        extractedAddress: '',
        extractedPhone: '', 
        verified: false
    },
    loan: {
        amount: '', interestRate: '', tenure: '', 
        verified: false 
    },
    guarantor: { name: '', phone: '', relationship: '' },
    confirmation: false,
};

const Application = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(initialFormData);
    const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
    const [completedSteps, setCompletedSteps] = useState({});
    
    const navigate = useNavigate(); // <-- Now uses the real hook
    const { key } = useParams();  // <-- Now uses the real hook
    
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [offerKey, setOfferKey] = useState(key); 
    const [tesseractReady, setTesseractReady] = useState(false); 
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceApiReady, setFaceApiReady] = useState(false); 

    const totalSteps = 3;

    useEffect(() => {
        const loadScript = (id, src, onLoad, onError) => {
            if (document.getElementById(id)) {
                onLoad();
                return;
            }
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = true;
            script.onload = onLoad;
            script.onerror = onError;
            document.body.appendChild(script);
        };

        loadScript(
            'tesseract-script',
            'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js',
            () => {
                console.log('Tesseract.js loaded');
                setTesseractReady(true);
            },
            () => setError('Failed to load OCR service.')
        );

        loadScript(
            'faceapi-script',
            'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
            () => {
                console.log('face-api.js loaded. Loading models...');
                setFaceApiReady(true);
                Promise.all([
                    window.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    window.faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    window.faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]).then(() => {
                    console.log('Face AI Models Loaded');
                    setModelsLoaded(true);
                }).catch(() => setError('Failed to load AI face models.'));
            },
            () => setError('Failed to load Face API.')
        );

        return () => {
            const tesseractScript = document.getElementById('tesseract-script');
            if (tesseractScript) document.body.removeChild(tesseractScript);
            
            const faceApiScript = document.getElementById('faceapi-script');
            if (faceApiScript) document.body.removeChild(faceApiScript);
        };
    }, []);

    useEffect(() => {
        if (!offerKey || offerKey === 'default-offer-key') {
            setError('Invalid or missing application key. Please start over from the chat.');
            setIsLoading(false);
            return;
        }

        const fetchOffer = async () => {
            try {
                const response = await fetch(`${API_URL}/offers/${offerKey}`);
                if (response.status === 404) {
                    throw new Error('The loan offer has expired or is invalid. Please start a new chat.');
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch offer data. Please try again.');
                }
                const data = await response.json();
                
                setFormData(prev => ({
                    ...prev,
                    loan: {
                        amount: data.loanAmount.toString(),
                        interestRate: parseFloat(data.interestRate).toFixed(2), 
                        tenure: `${data.tenureMonths} Months`,
                        verified: true 
                    },
                    bank: {
                        ...prev.bank,
                        panCard: data.pan || '', 
                        panVerified: false, 
                    },
                    personal: {
                        ...prev.personal,
                        phone: data.phone || '', 
                    }
                }));
                setIsLoading(false);

            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };

        fetchOffer();
    }, [offerKey]); 


    const updateField = (section, key, value) => {
        if (section === 'confirmation') {
            setFormData(prev => ({ ...prev, confirmation: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [key]: value,
                },
            }));
        }
    };

    const stepComponents = [
        { key: 1, name: 'Personal Details', component: PersonalDetails, dataKey: 'personal' },
        { key: 2, name: 'Guarantor Details', component: GuarantorDetails, dataKey: 'guarantor' },
        { key: 3, name: 'Confirmation', component: FinalConfirmation, dataKey: 'confirmation' },
    ];

    const currentStepConfig = stepComponents.find(c => c.key === step);
    const CurrentStepComponent = currentStepConfig.component;
    
    let currentStepData;
    if (currentStepConfig.dataKey === 'confirmation') {
        currentStepData = formData; 
    } else if (currentStepConfig.dataKey === 'personal') {
        currentStepData = formData; 
    } else {
        currentStepData = formData[currentStepConfig.dataKey];
    }
    
    const handleNext = async () => {
        if (isCurrentStepValid) {
            setCompletedSteps(prev => ({ ...prev, [step]: true }));
            
            if (step < totalSteps) {
                setStep(step + 1);
                setIsCurrentStepValid(false); 
            
            } else if (step === totalSteps) {
                
                setIsLoading(true); 
                try {
                    const loanDetails = {
                        amount: formData.loan.amount,
                        rate: formData.loan.interestRate,
                        tenure: parseInt(formData.loan.tenure), 
                    };

                    const response = await fetch(`${API_URL}/submit-application`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ offerKey, formData, loanDetails })
                    });
                    
                    const data = await response.json();
                    setIsLoading(false);

                    if (data.success) {
                        alert(`Application Submitted Successfully! Your Application ID is: ${data.applicationId}`);
                        console.log("Final Application Data:", formData);
                        navigate('/'); // <-- This will now work
                    } else {
                        alert(`Submission Failed: ${data.message || 'Unknown error'}`);
                    }
                } catch (err) {
                    setIsLoading(false);
                    alert(`Submission Error: ${err.message}`);
                }
            }
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            if (completedSteps[step - 1]) {
                setIsCurrentStepValid(true);
            }
        } else {
            navigate('/agent'); 
        }
    };

    const Stepper = () => (
        <div className="flex justify-between mb-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
            {stepComponents.map((item) => {
                const isActive = item.key === step;
                const isCompleted = completedSteps[item.key] || (item.key < step);
                return (
                    <div key={item.key} className="flex flex-col items-center flex-1 mx-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition duration-300 ${isActive ? 'bg-blue-600 scale-110 shadow-lg' : isCompleted ? 'bg-blue-500' : 'bg-gray-400'}`}>
                            {isCompleted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            ) : ( item.key )}
                        </div>
                        <span className={`text-sm mt-3 text-center transition-colors font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                            {item.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    if (isLoading && step === 1 && !completedSteps[1]) {
        return (
            <div className="relative min-h-screen w-full bg-white text-gray-900 flex items-center justify-center p-4">
                <h2 className="text-2xl font-semibold text-center">Loading Your Loan Offer...</h2>
            </div>
        );
    }

    if (error) {
         return (
            <div className="relative min-h-screen w-full bg-white text-gray-900 flex flex-col items-center justify-center text-center p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                <p className="text-lg text-gray-700 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/agent')} // <-- This will now work
                    className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                    Return to Chat
                </button>
            </div>
         );
    }

 return (
    <div className="relative min-h-screen w-full bg-white text-gray-900">
      <header className="fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="mx-auto w-full px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-2xl sm:text-3xl font-bold"> 
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Smart Finance AI
              </span>
            </Link>
            <span className="ml-3 sm:ml-6 text-xs sm:text-sm text-gray-500 hidden md:inline-block">
              / Loan Application
            </span>
          </div>
          <nav>
            <button
              onClick={() => navigate('/agent')} 
              className="rounded-lg bg-red-600 px-3 py-2 sm:px-4 text-sm font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block sm:mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              <span className="hidden sm:inline">Exit Application</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 pt-28 pb-16 w-full px-4">
        <div className="w-full max-w-7xl mx-auto bg-white p-4 sm:p-8 md:p-12 rounded-none border-none">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-10 text-center">
            Personal Loan Application Form
          </h1>

          <Stepper />

          <div className="mb-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">
                Loan Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                    <label className="block text-sm font-medium text-gray-500">Loan Amount</label>
                    <p className="text-2xl font-bold text-blue-600">
                        {formData.loan.amount ? `₹ ${parseFloat(formData.loan.amount).toLocaleString()}` : '-'}
                    </p>
                </div>
                <div className="text-center md:text-left">
                    <label className="block text-sm font-medium text-gray-500">Interest Rate (p.a.)</label>
                    <p className="text-2xl font-bold text-gray-800">
                        {formData.loan.interestRate ? `${formData.loan.interestRate} %` : '- %'}
                    </p>
                </div>
                <div className="text-center md:text-left">
                    <label className="block text-sm font-medium text-gray-500">Tenure</label>
                    <p className="text-2xl font-bold text-gray-800">
                        {formData.loan.tenure ? `${formData.loan.tenure}` : '- Months'}
                    </p>
                </div>
            </div>
          </div>

          <div className="mb-10 p-4 sm:p-8 bg-gray-50 rounded-xl border border-gray-200 min-h-[400px] shadow-sm">
            <CurrentStepComponent
              formData={currentStepData}
              updateField={updateField}
              setValid={setIsCurrentStepValid}
              tesseractReady={tesseractReady} 
              faceApiReady={faceApiReady} 
              modelsLoaded={modelsLoaded}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={handleBack}
              className={`py-3 px-6 sm:py-4 sm:px-8 rounded-lg font-semibold transition-all duration-300 shadow-sm w-full sm:w-auto ${
                step === 1
                  ? 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700 hover:shadow-md'
              }`}
            >
              {step === 1 ? 'Back to Chat' : 'Previous Step'}
            </button>

            <button
              onClick={handleNext}
              disabled={!isCurrentStepValid || (isLoading && step === totalSteps)} 
              className={`py-3 px-6 sm:py-4 sm:px-8 rounded-lg font-bold transition-all duration-300 shadow-sm w-full sm:w-auto ${
                !isCurrentStepValid
                  ? 'bg-blue-300 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-105'
              } ${(isLoading && step === totalSteps) ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isLoading && step === totalSteps ? 'Submitting...' : (step < totalSteps ? 'Proceed to Next Step' : 'Submit Application')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Application;