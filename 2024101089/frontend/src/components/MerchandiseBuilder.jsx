import { useState } from 'react';

const MerchandiseBuilder = ({ merchandise, setMerchandise }) => {

    const addItem = () => {
        setMerchandise([
            ...merchandise,
            {
                name: '',
                price: 0,
                stock: 100,
                limitPerUser: 1,
                image: '',
                description: '',
                variants: []
            }
        ]);
    };

    const removeItem = (index) => {
        setMerchandise(merchandise.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const updated = [...merchandise];
        updated[index][field] = value;
        setMerchandise(updated);
    };

    // Variant Handling
    const addVariant = (itemIndex) => {
        const updated = [...merchandise];
        if (!updated[itemIndex].variants) updated[itemIndex].variants = [];
        updated[itemIndex].variants.push({ type: 'Size', options: [] });
        setMerchandise(updated);
    };

    const removeVariant = (itemIndex, variantIndex) => {
        const updated = [...merchandise];
        updated[itemIndex].variants = updated[itemIndex].variants.filter((_, i) => i !== variantIndex);
        setMerchandise(updated);
    };

    const updateVariantType = (itemIndex, variantIndex, newType) => {
        const updated = [...merchandise];
        updated[itemIndex].variants[variantIndex].type = newType;
        setMerchandise(updated);
    };

    const updateVariantOptions = (itemIndex, variantIndex, optionsString) => {
        const updated = [...merchandise];
        // Split by comma and clean
        const options = optionsString.split(',').map(s => s.trim()); // Keep empty strings while typing? No, filter effectively?
        // Actually, store raw options for now? No, let's store array but parse on input.
        updated[itemIndex].variants[variantIndex].options = options;
        setMerchandise(updated);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Merchandise Items</h3>

            {merchandise.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 relative animate-fade-in">
                    <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold p-1"
                        title="Remove Item"
                    >
                        &times;
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Item Name</label>
                            <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. Festival Hoodie"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                                    className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Stock</label>
                                <input
                                    type="number"
                                    value={item.stock}
                                    onChange={(e) => updateItem(index, 'stock', e.target.value)}
                                    className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                            <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Optional description"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Max per User</label>
                            <input
                                type="number"
                                value={item.limitPerUser || 1}
                                onChange={(e) => updateItem(index, 'limitPerUser', e.target.value)}
                                className="w-full border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Variants Section */}
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Variants (Size, Color, etc.)</label>

                        {(item.variants || []).map((variant, vIndex) => (
                            <div key={vIndex} className="flex gap-2 mb-2 items-start">
                                <div className="w-1/3">
                                    <input
                                        type="text"
                                        value={variant.type}
                                        onChange={(e) => updateVariantType(index, vIndex, e.target.value)}
                                        className="w-full border-gray-300 rounded p-1.5 text-sm"
                                        placeholder="Type (e.g. Size)"
                                    />
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={variant.options.join(', ')}
                                        onChange={(e) => updateVariantOptions(index, vIndex, e.target.value)}
                                        className="w-full border-gray-300 rounded p-1.5 text-sm"
                                        placeholder="Options (comma separated: S, M, L)"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeVariant(index, vIndex)}
                                    className="text-gray-400 hover:text-red-500 pt-1"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => addVariant(index)}
                            className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                        >
                            + Add Variant Type
                        </button>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2 font-medium"
            >
                <span className="text-xl">+</span> Add Merchandise Item
            </button>
        </div>
    );
};

export default MerchandiseBuilder;
