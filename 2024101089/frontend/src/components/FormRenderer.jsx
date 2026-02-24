import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const FormRenderer = ({ formFields, onResponseChange, responses }) => {
    const [uploading, setUploading] = useState({});

    if (!formFields || formFields.length === 0) return null;

    const handleFileUpload = async (label, file) => {
        if (!file) return;
        setUploading(prev => ({ ...prev, [label]: true }));
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Store the URL as the answer
            onResponseChange(label, data.url);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(prev => ({ ...prev, [label]: false }));
        }
    };

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
                            <div>
                                <input
                                    type="file"
                                    className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-indigo-50 file:text-indigo-700
                                    hover:file:bg-indigo-100"
                                    onChange={(e) => handleFileUpload(field.label, e.target.files[0])}
                                    required={field.required && !responses[field.label]}
                                    disabled={uploading[field.label]}
                                />
                                {uploading[field.label] && (
                                    <p className="text-xs text-indigo-600 mt-1 animate-pulse">Uploading...</p>
                                )}
                                {responses[field.label] && !uploading[field.label] && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Uploaded: <a href={`${API_URL.replace(/\/api$/, '')}${responses[field.label]}?token=${localStorage.getItem('token')}`} target="_blank" rel="noreferrer" className="underline">{responses[field.label].split('/').pop()}</a>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FormRenderer;
