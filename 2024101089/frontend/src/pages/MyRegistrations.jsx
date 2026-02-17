import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../apiConfig';

const MyRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Registrations</h1>
                    <Link to="/events" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Browse More Events &rarr;
                    </Link>
                </div>

                {registrations.length === 0 ? (
                    <div className="bg-white p-10 rounded-lg shadow text-center">
                        <p className="text-gray-500 text-lg">You haven't registered for any events yet.</p>
                        <Link to="/events" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                            Explore Events
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registrations.map((reg) => (
                            <div key={reg._id} className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center transition hover:shadow-lg">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{reg.event?.name || "Unknown Event"}</h2>
                                    <p className="text-sm text-gray-500">
                                        {reg.event?.startDate ? new Date(reg.event.startDate).toLocaleDateString() : 'Date TBA'}
                                    </p>
                                    <div className="mt-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                            ${reg.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                reg.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {reg.status}
                                        </span>
                                        {reg.status === 'Pending' && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => handleUploadClick(reg._id)}
                                                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                                                >
                                                    Upload Payment Proof
                                                </button>
                                            </div>
                                        )}
                                        {reg.ticketId && (
                                            <div className="mt-2">
                                                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded block mb-1">
                                                    Ticket: {reg.ticketId}
                                                </span>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${reg.ticketId}`}
                                                    alt="QR Code"
                                                    className="w-24 h-24 border rounded"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Link to={`/events/${reg.event?._id}`} className="text-indigo-600 hover:underline text-sm text-right">
                                        View Details
                                    </Link>
                                    {/* Placeholder for future specific actions like "Leave Team" or "View Ticket" */}
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
