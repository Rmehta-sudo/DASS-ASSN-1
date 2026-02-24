import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import FormBuilder from '../../components/FormBuilder';
import MerchandiseBuilder from '../../components/MerchandiseBuilder';
import { API_URL } from '../../apiConfig';

const EventEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [error, setError] = useState('');
    const [registrationCount, setRegistrationCount] = useState(0);

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

            // Fetch event data and registration list in parallel
            const [{ data }, regsRes] = await Promise.all([
                axios.get(`${API_URL}/events/${id}`, config),
                axios.get(`${API_URL}/registrations/event/${id}`, config).catch(() => ({ data: [] }))
            ]);

            setRegistrationCount(regsRes.data.length);

            // Format dates for datetime-local input
            const formattedEvent = {
                ...data,
                startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
                endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
                deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '',
                tags: data.tags ? data.tags.join(', ') : '',
                formFields: data.formFields || [],
                merchandise: data.merchandise || []
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
                    return { ...m, limitPerUser: Number(m.limitPerUser) || 1 };
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

    const isFieldDisabled = (fieldName) => {
        if (eventData.status === 'Draft') return false; // All editable in Draft

        if (['Ongoing', 'Completed', 'Cancelled'].includes(eventData.status)) {
            return fieldName !== 'status'; // Only status editable once past Published
        }

        if (eventData.status === 'Published') {
            // After publication: only description, deadline, registrationLimit and status
            // are allowed to change. All other core fields are locked.
            // Note: formFields has its own separate lock (isFormLocked) based on registrations.
            const allowedWhenPublished = ['description', 'deadline', 'registrationLimit', 'status'];
            return !allowedWhenPublished.includes(fieldName);
        }

        return false;
    };

    // Form builder is locked independently: once the first registration arrives,
    // form fields can never be changed (regardless of event status).
    const isFormLocked = registrationCount > 0;

    const handleCloseRegistrations = async () => {
        if (!window.confirm('Close registrations now? This will set the deadline to the current time and save immediately.')) return;

        const now = new Date().toISOString().slice(0, 16);
        const updatedData = { ...eventData, deadline: now };
        setEventData(updatedData);

        // Persist immediately — don't wait for the user to click Save
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                ...updatedData,
                tags: updatedData.tags.split(',').map(t => t.trim()),
                merchandise: updatedData.merchandise.map(m => ({
                    ...m,
                    limitPerUser: Number(m.limitPerUser) || 1
                }))
            };
            await axios.put(`${API_URL}/events/${id}`, payload, config);
            alert('Registrations closed — deadline set to now.');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    if (fetchLoading) {
        return <div className="p-10 text-center">Loading event...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Edit Event</h2>
                    {eventData.status === 'Published' && (
                        <button
                            type="button"
                            onClick={handleCloseRegistrations}
                            className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
                            title="Examples: Set deadline to now to stop new registrations"
                        >
                            Close Registrations
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Event Name</label>
                                <input type="text" name="name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.name} onChange={handleChange} disabled={isFieldDisabled('name')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.status} onChange={handleChange} disabled={isFieldDisabled('status')}>
                                    <option value="Draft">Draft (Hidden)</option>
                                    <option value="Published">Published (Visible)</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select name="type" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.type} onChange={handleChange} disabled={isFieldDisabled('type')}>
                                    <option value="Normal">Normal Event (Workshop/Talk)</option>
                                    <option value="Merchandise">Merchandise Sale</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Eligibility</label>
                                <select name="eligibility" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.eligibility} onChange={handleChange} disabled={isFieldDisabled('eligibility')}>
                                    <option value="Anyone">Anyone</option>
                                    <option value="IIIT Only">IIIT Only</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea name="description" rows="3" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.description} onChange={handleChange} disabled={isFieldDisabled('description')}></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Registration Fee (₹)</label>
                                <input type="number" name="registrationFee" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.registrationFee} onChange={handleChange} disabled={isFieldDisabled('registrationFee')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                                <input type="number" name="registrationLimit" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.registrationLimit} onChange={handleChange} disabled={isFieldDisabled('registrationLimit')} />
                            </div>



                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                                <input type="datetime-local" name="startDate" required lang="en-GB" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.startDate} onChange={handleChange} disabled={isFieldDisabled('startDate')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                                <input type="datetime-local" name="endDate" lang="en-GB" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.endDate} onChange={handleChange} disabled={isFieldDisabled('endDate')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                                <input type="datetime-local" name="deadline" required lang="en-GB" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.deadline} onChange={handleChange} disabled={isFieldDisabled('deadline')} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input type="text" name="location" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.location} onChange={handleChange} disabled={isFieldDisabled('location')} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
                                <input type="text" name="tags" placeholder="tech, coding, fun" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-200"
                                    value={eventData.tags} onChange={handleChange} disabled={isFieldDisabled('tags')} />
                            </div>
                        </div>

                        {/* Merchandise Editor Section */}
                        {eventData.type === 'Merchandise' && !isFieldDisabled('merchandise') && (
                            <div className="mt-8 pt-6 border-t">
                                <MerchandiseBuilder
                                    merchandise={eventData.merchandise}
                                    setMerchandise={(newMerch) => setEventData({ ...eventData, merchandise: newMerch })}
                                />
                            </div>
                        )}
                        {eventData.type === 'Merchandise' && isFieldDisabled('merchandise') && (
                            <div className="mt-8 pt-6 border-t text-gray-500">
                                Merchandise details cannot be edited after publishing.
                            </div>
                        )}

                        {/* Form Builder Section (Only for Normal Events) */}
                        {eventData.type === 'Normal' && !isFormLocked && (
                            <div className="mt-8 pt-6 border-t">
                                <FormBuilder
                                    formFields={eventData.formFields}
                                    setFormFields={handleFormFieldsChange}
                                />
                                {registrationCount === 0 && eventData.status !== 'Draft' && (
                                    <p className="mt-2 text-xs text-amber-600">
                                        ⚠️ Form will be locked once the first registration is received.
                                    </p>
                                )}
                            </div>
                        )}
                        {eventData.type === 'Normal' && isFormLocked && (
                            <div className="mt-8 pt-6 border-t">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                                    🔒 <strong>Form Locked</strong> — This event already has {registrationCount} registration{registrationCount !== 1 ? 's' : ''}. Form fields cannot be modified to protect existing participants' submissions.
                                </div>
                                {/* Show read-only preview of the locked fields */}
                                {eventData.formFields.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {eventData.formFields.map((field, i) => (
                                            <div key={i} className="bg-gray-50 border border-gray-200 rounded p-3 flex items-center justify-between text-sm text-gray-600">
                                                <span>
                                                    <span className="font-medium text-gray-800">#{i + 1} {field.label}</span>
                                                    {field.required && <span className="ml-1 text-red-500 text-xs">*required</span>}
                                                </span>
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{field.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
