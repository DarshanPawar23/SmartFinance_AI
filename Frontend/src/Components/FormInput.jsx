import React from 'react';

const FormInput = ({ label, value, onChange, placeholder, type = 'text', maxLength, required, disabled, className = '', readOnly = false }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
        />
    </div>
);

export default FormInput;