import { useState } from 'react';

const FormBuilder = ({ formFields, setFormFields }) => {

    const addField = (type) => {
        setFormFields([...formFields, {
            label: `Question ${formFields.length + 1}`,
            type,
            required: false,
            options: []
        }]);
    };

    const updateField = (index, key, value) => {
        const updated = [...formFields];
        updated[index][key] = value;
        setFormFields(updated);
    };

    const removeField = (index) => {
        const updated = [...formFields];
        updated.splice(index, 1);
        setFormFields(updated);
    };

    const addOption = (index, option) => {
        // Simple comma separated for now
        const updated = [...formFields];
        updated[index].options = option.split(',').map(s => s.trim());
        setFormFields(updated);
    };

    return (
        <div className="border p-4 rounded bg-gray-50 mt-4 h-[100%]">
            <h3 className="font-semibold text-gray-700">Custom Registration Form</h3>
            <p className="text-xs text-gray-500 mb-4">Add extra questions for participants.</p>

            <div className="flex space-x-2 mb-4">
                <button type="button" onClick={() => addField('text')} className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100">+ Text</button>
                <button type="button" onClick={() => addField('number')} className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100">+ Number</button>
                <button type="button" onClick={() => addField('dropdown')} className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100">+ Dropdown</button>
                <button type="button" onClick={() => addField('checkbox')} className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100">+ Checkbox</button>
                <button type="button" onClick={() => addField('file')} className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100">+ File Upload</button>
            </div>

            {formFields.map((field, index) => (
                <div key={index} className="bg-white p-3 border rounded mb-2 relative group">
                    <button type="button" onClick={() => removeField(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs">Remove</button>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="block text-xs text-gray-500">Label/Question</label>
                            <input type="text" className="w-full border px-2 py-1 text-sm rounded"
                                value={field.label} onChange={(e) => updateField(index, 'label', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500">Type</label>
                            <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{field.type}</span>
                        </div>
                    </div>

                    <div className="flex items-center mb-2">
                        <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, 'required', e.target.checked)} className="mr-2" />
                        <span className="text-sm text-gray-600">Required?</span>
                    </div>

                    {(field.type === 'dropdown' || field.type === 'checkbox') && (
                        <div>
                            <label className="block text-xs text-gray-500">Options (comma separated)</label>
                            <input type="text" className="w-full border px-2 py-1 text-sm rounded"
                                placeholder="Option 1, Option 2, Option 3"
                                defaultValue={field.options.join(', ')}
                                onBlur={(e) => addOption(index, e.target.value)} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FormBuilder;
