import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../apiConfig';

const MyRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('Normal');

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const { data } = await axios.get(`${API_URL}/registrations/my`, config);
            setRegistrations(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching registrations:", error);
            setLoading(false);
        }
    };

    const handleUploadClick = async (regId) => {
        const url = prompt("Enter Payment Proof URL (e.g., Google Drive link):");
        if (url) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`${API_URL}/registrations/${regId}/payment`, {
                    paymentProof: url
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Proof uploaded successfully!");
                fetchRegistrations();
            } catch (error) {
                alert("Error uploading proof: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const getFilteredRegistrations = () => {
        const now = new Date();
        return registrations.filter(reg => {
            const event = reg.event;
            if (!event) return false;

            // Check status first for Cancelled/Rejected
            if (activeTab === 'Cancelled') {
                return reg.status === 'Cancelled' || reg.status === 'Rejected';
            }

            // Exclude cancelled/rejected from other tabs
            if (reg.status === 'Cancelled' || reg.status === 'Rejected') return false;

            const isPast = event.endDate ? new Date(event.endDate) < now : new Date(event.startDate) < now;

            if (activeTab === 'Completed') {
                return isPast;
            }

            // Normal & Merchandise (Upcoming/Ongoing)
            if (isPast) return false;

            if (activeTab === 'Merchandise') {
                return event.type === 'Merchandise';
            }

            if (activeTab === 'Normal') {
                return event.type !== 'Merchandise';
            }

            return false;
        });
    };

    const copyTicketId = (id) => {
        navigator.clipboard.writeText(id);
        alert("Ticket ID copied to clipboard: " + id);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    const filteredRegs = getFilteredRegistrations();

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Participation History</h1>
                    <Link to="/events" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Browse More Events &rarr;
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-6 w-fit">
                    {['Normal', 'Merchandise', 'Completed', 'Cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {filteredRegs.length === 0 ? (
                    <div className="bg-white p-16 rounded-2xl shadow-sm text-center border border-gray-100">
                        <div className="text-4xl mb-4">📭</div>
                        <p className="text-gray-500 text-lg mb-6">No {activeTab.toLowerCase()} records found.</p>
                        {activeTab !== 'Cancelled' && (
                            <Link to="/events" className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition">
                                Explore Events
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRegs.map((reg) => (
                            <div key={reg._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2 ${reg.event?.type === 'Merchandise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {reg.event?.type}
                                            </span>
                                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{reg.event?.name}</h2>
                                            <p className="text-sm text-gray-500">
                                                by <span className="font-medium text-gray-700">{reg.event?.organizer?.name || 'Organizer'}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full 
                                                ${reg.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                                    reg.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {reg.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                                        {reg.teamName && (
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="font-semibold block text-xs text-gray-500 uppercase">Team Name</span>
                                                {reg.teamName}
                                            </div>
                                        )}

                                        {reg.ticketId ? (
                                            <div
                                                className="bg-indigo-50 p-2 rounded cursor-pointer hover:bg-indigo-100 transition group"
                                                onClick={() => copyTicketId(reg.ticketId)}
                                                title="Click to copy"
                                            >
                                                <span className="font-semibold block text-xs text-indigo-500 uppercase">Ticket ID 📋</span>
                                                <span className="font-mono text-indigo-700">{reg.ticketId}</span>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="font-semibold block text-xs text-gray-500 uppercase">Ticket ID</span>
                                                <span className="italic text-gray-400">Pending...</span>
                                            </div>
                                        )}
                                    </div>

                                    {reg.status === 'Pending' && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handleUploadClick(reg._id)}
                                                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                                            >
                                                Upload Payment Proof
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center items-end border-l border-gray-100 pl-6 space-y-3 min-w-[140px]">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
                                        <p className="text-gray-800 font-medium">
                                            {reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString() : 'TBA'}
                                        </p>
                                    </div>

                                    {/* Rate Button for Completed/Past Confirmed Events */}
                                    {activeTab === 'Completed' && reg.status === 'Confirmed' && (
                                        <button
                                            onClick={() => openFeedbackModal(reg)}
                                            className="w-full text-center py-2 px-4 rounded-lg bg-yellow-400 text-yellow-900 font-medium hover:bg-yellow-500 transition shadow-sm"
                                        >
                                            Rate Event ⭐
                                        </button>
                                    )}

                                    <Link
                                        to={`/events/${reg.event?._id}`}
                                        className="w-full text-center py-2 px-4 rounded-lg bg-gray-50 text-gray-600 font-medium hover:bg-gray-100 hover:text-indigo-600 transition"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyRegistrations;
