import React, { useEffect } from 'react';

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
        <span className="text-sm font-medium text-gray-600">{label}:</span>
        <span className="text-sm font-semibold text-gray-900 text-right break-words">{value || 'N/A'}</span>
    </div>
);

const InfoBox = ({ title, value }) => (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center border border-blue-100">
        <span className="text-sm font-medium text-blue-700 block">{title}</span>
        <span className="text-xl font-semibold text-blue-900 block">{value}</span>
    </div>
);

const FinalConfirmation = ({ formData, updateField, setValid }) => {
    
    const confirmationState = formData.review?.confirmation || false;

    useEffect(() => {
        setValid(confirmationState);
    }, [confirmationState, setValid]);

    const maskAccountNumber = (num) => {
        if (!num) return 'N/A';
        const numStr = String(num);
        return "****" + numStr.slice(-4);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-blue-500 pb-3">3. Final Confirmation</h3>
            
            <div className="p-4 md:p-6 bg-white rounded-lg shadow-xl border border-gray-200 space-y-6">
                
                <div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-3">Loan Offer Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InfoBox 
                            title="Loan Amount" 
                            value={`₹${parseFloat(formData.loan.amount || 0).toLocaleString()}`} 
                        />
                        <InfoBox 
                            title="Interest Rate" 
                            value={`${formData.loan.interestRate || '0'}% p.a.`} 
                        />
                        <InfoBox 
                            title="Loan Tenure" 
                            value={formData.loan.tenure || 'N/A'} 
                        />
                    </div>
                </div>

                <hr className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    
                    <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-800">Applicant Details</h4>
                        <div className="flex justify-center p-2">
                            <img 
                                src={formData.personal.faceImage} 
                                alt="Applicant" 
                                className="w-40 h-40 object-cover rounded-lg shadow-md border-2 border-gray-100"
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <DetailRow label="Name" value={formData.personal.name} />
                            <DetailRow label="Email" value={formData.personal.email} />
                            <DetailRow label="Phone" value={formData.personal.phone} />
                            <DetailRow label="Date of Birth" value={formData.personal.dob} />
                            <DetailRow label="Bank Account" value={maskAccountNumber(formData.bank.accountNumber)} />
                            <DetailRow label="Verified Salary" value={`₹${parseFloat(formData.salary.extractedSalary || 0).toLocaleString()}`} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-800">Guarantor Details</h4>
                        <div className="flex justify-center p-2">
                            <img 
                                src={formData.guarantor.documentImage}
                                alt="Guarantor" 
                                className="w-40 h-40 object-cover rounded-lg shadow-md border-2 border-gray-100"
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <DetailRow label="Name" value={formData.guarantor.name} />
                            <DetailRow label="Relationship" value={formData.guarantor.relationship} />
                            <DetailRow label="Phone" value={formData.guarantor.phone} />
                            <DetailRow label="Date of Birth" value={formData.guarantor.dob} />
                            <DetailRow label="Gender" value={formData.guarantor.gender} />
                            <DetailRow label="Phone Verified" value={formData.guarantor.phoneVerified ? 'Yes' : 'No'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-start p-4 bg-gray-100 rounded-lg shadow-inner">
                <input
                    type="checkbox"
                    id="confirmation"
                    checked={confirmationState}
                    onChange={(e) => updateField('review', 'confirmation', e.target.checked)} 
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1 flex-shrink-0"
                />
                <label htmlFor="confirmation" className="ml-3 text-sm text-gray-700">
                    I hereby declare that the information provided is true and correct to the best of my knowledge. I agree to the terms and conditions and consent to the loan agreement.
                </label>
            </div>
        </div>
    );
};

export default FinalConfirmation;