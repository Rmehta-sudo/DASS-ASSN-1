import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FormBuilder from '../../components/FormBuilder';
import { API_URL } from '../../apiConfig';

const EventEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');

    const [eventData, setEventData] = useState({
        name: '',
        description: '',
        type: 'Normal',
        eligibility: 'Anyone',
        registrationFee: 0,
        registrationLimit: 100,
        startDate: '',
        endDate: '',
        deadline: '',
        location: 'IIIT Hyderabad',
        tags: '',
        formFields: [],
        merchandise: [],
        status: 'Draft'
    });

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const { data } = await axios.get(`${API_URL}/events/${id}`, config);

            // Format dates for datetime-local input
            const formattedEvent = {
                ...data,
                startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
                endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
                deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '',
                tags: data.tags ? data.tags.join(', ') : '',
                formFields: data.formFields || [],
                merchandise: (data.merchandise || []).map(m => ({
                    ...m,
                    _variantString: m.variants && m.variants.length > 0
                        ? `${m.variants[0].type}: ${m.variants[0].options.join(', ')}`
                        : ''
                }))
            };

            setEventData(formattedEvent);
            setFetchLoading(false);
        } catch (err) {
            setError('Failed to load event');
            setFetchLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData({ ...eventData, [name]: value });
    };

    const handleFormFieldsChange = (newFields) => {
        setEventData({ ...eventData, formFields: newFields });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("Not authenticated");

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Process tags from string to array
            const payload = {
                ...eventData,
                tags: eventData.tags.split(',').map(t => t.trim()),
                merchandise: eventData.merchandise.map(m => {
                    const { _variantString, ...rest } = m;
                    return { ...rest, limitPerUser: Number(rest.limitPerUser) || 1 };
                })
            };

            await axios.put(`${API_URL}/events/${id}`, payload, config);

            alert('Event Updated Successfully!');
            navigate('/organizer/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return <div className="p-10 text-center">Loading event...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Edit Event</h2>
                </div>

                <div className="p-6">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                                <input type="text" name="name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.name} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.status} onChange={handleChange}>
                                    <option value="Draft">Draft (Hidden)</option>
                                    <option value="Published">Published (Visible)</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select name="type" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.type} onChange={handleChange}>
                                    <option value="Normal">Normal Event (Workshop/Talk)</option>
                                    <option value="Merchandise">Merchandise Sale</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Eligibility</label>
                                <select name="eligibility" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.eligibility} onChange={handleChange}>
                                    <option value="Anyone">Anyone</option>
                                    <option value="IIIT Only">IIIT Only</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea name="description" rows="3" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.description} onChange={handleChange}></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Registration Fee (₹)</label>
                                <input type="number" name="registrationFee" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.registrationFee} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                                <input type="number" name="registrationLimit" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.registrationLimit} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Team Size (Min)</label>
                                <input type="number" name="teamSizeMin" min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.teamSizeMin || 1} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Team Size (Max)</label>
                                <input type="number" name="teamSizeMax" min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.teamSizeMax || 1} onChange={handleChange} />
                                <p className="text-xs text-gray-500">Set &gt; 1 for Team Events</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input type="datetime-local" name="startDate" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.startDate} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                                <input type="datetime-local" name="deadline" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.deadline} onChange={handleChange} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input type="text" name="location" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.location} onChange={handleChange} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                                <input type="text" name="tags" placeholder="tech, coding, fun" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={eventData.tags} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Merchandise Editor Section */}
                        <div className="mt-8 pt-6 border-t">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Merchandise Management</h3>
                            <div className="space-y-4">
                                {eventData.merchandise.map((item, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newMerch = eventData.merchandise.filter((_, i) => i !== index);
                                                setEventData({ ...eventData, merchandise: newMerch });
                                            }}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
                                        >
                                            &times;
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase">Item Name</label>
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => {
                                                        const newMerch = [...eventData.merchandise];
                                                        newMerch[index].name = e.target.value;
                                                        setEventData({ ...eventData, merchandise: newMerch });
                                                    }}
                                                    className="w-full border-gray-300 rounded p-1 text-sm"
                                                    placeholder="e.g. T-Shirt"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase">Price (₹)</label>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const newMerch = [...eventData.merchandise];
                                                        newMerch[index].price = e.target.value;
                                                        setEventData({ ...eventData, merchandise: newMerch });
                                                    }}
                                                    className="w-full border-gray-300 rounded p-1 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase">Stock</label>
                                                <input
                                                    type="number"
                                                    value={item.stock}
                                                    onChange={(e) => {
                                                        const newMerch = [...eventData.merchandise];
                                                        newMerch[index].stock = e.target.value;
                                                        setEventData({ ...eventData, merchandise: newMerch });
                                                    }}
                                                    className="w-full border-gray-300 rounded p-1 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase">Max per User</label>
                                                <input
                                                    type="number"
                                                    value={item.limitPerUser || 1}
                                                    onChange={(e) => {
                                                        const newMerch = [...eventData.merchandise];
                                                        newMerch[index].limitPerUser = e.target.value;
                                                        setEventData({ ...eventData, merchandise: newMerch });
                                                    }}
                                                    className="w-full border-gray-300 rounded p-1 text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                                    Variants (Format: "Type: Option1, Option2")
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item._variantString || ''}
                                                    placeholder="e.g. Size: S, M, L, XL"
                                                    onChange={(e) => {
                                                        const str = e.target.value;
                                                        const newMerch = [...eventData.merchandise];
                                                        newMerch[index]._variantString = str;

                                                        // Parse immediately for preview or on save
                                                        // Simple parser: "Type: Opt1, Opt2"
                                                        if (str.includes(':')) {
                                                            const [type, opts] = str.split(':');
                                                            const options = opts.split(',').map(s => s.trim()).filter(Boolean);
                                                            newMerch[index].variants = [{ type: type.trim(), options }];
                                                        } else {
                                                            newMerch[index].variants = [];
                                                        }

                                                        setEventData({ ...eventData, merchandise: newMerch });
                                                    }}
                                                    className="w-full border-gray-300 rounded p-1 text-sm font-mono bg-white"
                                                />
                                                <p className="text-xs text-gray-400 mt-1">Leave blank for no variants.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setEventData({
                                        ...eventData,
                                        merchandise: [...eventData.merchandise, { name: '', price: 0, stock: 100, limitPerUser: 1, variants: [], _variantString: '' }]
                                    })}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 transition"
                                >
                                    + Add Merchandise Item
                                </button>
                            </div>
                        </div>

                        {/* Form Builder Section (Only for Normal Events) */}
                        {eventData.type === 'Normal' && (
                            <div className="mt-8 pt-6 border-t">
                                <FormBuilder
                                    formFields={eventData.formFields}
                                    setFormFields={handleFormFieldsChange}
                                />
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button type="button" onClick={() => navigate('/organizer/dashboard')} className="mr-3 text-gray-600 hover:text-gray-900 px-4 py-2">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 shadow-md">
                                {loading ? 'Updating...' : 'Update Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventEdit;
