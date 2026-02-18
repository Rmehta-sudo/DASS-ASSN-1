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

                        {field.type === 'checkbox' && (
                            <div className="space-y-2 mt-2">
                                {field.options && field.options.map((option, idx) => (
                                    <div key={idx} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            value={option}
                                            checked={(responses[field.label] || []).includes(option)}
                                            onChange={(e) => {
                                                const current = responses[field.label] || [];
                                                let updated;
                                                if (e.target.checked) updated = [...current, option];
                                                else updated = current.filter(item => item !== option);
                                                onResponseChange(field.label, updated);
                                            }}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <label className="ml-2 block text-sm text-gray-900">{option}</label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {field.type === 'file' && (
                            <input
                                type="file"
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                                onChange={(e) => {
                                    // For now just storing file name or file object
                                    // In a real app, this would upload to server/S3 and get URL
                                    onResponseChange(field.label, e.target.files[0]?.name || '');
                                }}
                                required={field.required}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormRenderer;
