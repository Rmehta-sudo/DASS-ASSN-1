import React from 'react';

const FormRenderer = ({ formFields, onResponseChange, responses }) => {
    if (!formFields || formFields.length === 0) return null;

    return (
        <div className="border p-4 rounded-xl bg-gray-50 mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Additional Information</h3>
            <p className="text-xs text-gray-500 mb-4">Please answer the following questions from the organizer.</p>

            <div className="space-y-4">
                {formFields.map((field, index) => (
                    <div key={index} className="bg-white p-4 border rounded-lg shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'text' && (
                            <input
                                type="text"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                                value={responses[field.label] || ''}
                                onChange={(e) => onResponseChange(field.label, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'number' && (
                            <input
                                type="number"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                                value={responses[field.label] || ''}
                                onChange={(e) => onResponseChange(field.label, e.target.value)}
                                required={field.required}
                            />
                        )}

                        {field.type === 'dropdown' && (
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                                value={responses[field.label] || ''}
                                onChange={(e) => onResponseChange(field.label, e.target.value)}
                                required={field.required}
                            >
                                <option value="">Select an option</option>
                                {field.options && field.options.map((option, idx) => (
                                    <option key={idx} value={option}>{option}</option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormRenderer;
