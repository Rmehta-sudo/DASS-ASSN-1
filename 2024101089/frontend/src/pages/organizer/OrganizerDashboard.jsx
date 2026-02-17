import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../apiConfig';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [waitlistModal, setWaitlistModal] = useState({ open: false, eventId: null, eventName: '', registrations: [] });
    const [loadingWaitlist, setLoadingWaitlist] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Double check auth
        if (!user || user.role !== 'organizer') {
            navigate('/dashboard');
            return;
        }
        fetchMyEvents();
    }, [user, navigate]);

    const fetchMyEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const { data } = await axios.get(`${API_URL}/events/my`, config);
            setEvents(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching events", error);
            setLoading(false);
        }
    };

    const openWaitlist = async (eventId, eventName) => {
        setLoadingWaitlist(true);
        setWaitlistModal({ open: true, eventId, eventName, registrations: [] });

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const { data } = await axios.get(`${API_URL}/registrations/event/${eventId}`, config);
            setWaitlistModal({ open: true, eventId, eventName, registrations: data });
            setLoadingWaitlist(false);
        } catch (error) {
            console.error("Error fetching registrations", error);
            setLoadingWaitlist(false);
        }
    };

    const updateStatus = async (registrationId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await axios.put(`${API_URL}/registrations/${registrationId}/status`, { status: newStatus }, config);

            // Refresh the waitlist
            openWaitlist(waitlistModal.eventId, waitlistModal.eventName);
            alert(`Registration ${newStatus.toLowerCase()} successfully!`);
        } catch (error) {
            console.error("Error updating status", error);
            alert('Failed to update status');
        }
    };

    const closeWaitlist = () => {
        setWaitlistModal({ open: false, eventId: null, eventName: '', registrations: [] });
        fetchMyEvents(); // Refresh events to update counts
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">Organizer Panel</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Club: {user?.name}</span>
                            <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Your Events</h2>
                    <Link to="/organizer/events/create" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                        + Create New Event
                    </Link>
                </div>

                {events.length === 0 ? (
                    <div className="bg-white p-10 rounded shadow text-center text-gray-500">
                        You have not created any events yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <div key={event._id} className="bg-white rounded shadow overflow-hidden">
                                <div className="p-4 border-b">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-lg text-indigo-600">{event.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${event.status === 'Published' ? 'bg-green-100 text-green-800' :
                                            event.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                            }`}>{event.status}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-1">{new Date(event.startDate).toLocaleDateString()}</p>
                                </div>
                                <div className="p-4">
                                    <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                                    <p className="mt-2 text-sm">
                                        <span className="font-semibold">Registrations:</span> {event.currentRegistrations} / {event.registrationLimit}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 border-t flex justify-end">
                                    <button
                                        onClick={() => openWaitlist(event._id, event.name)}
                                        className="text-indigo-600 text-sm hover:underline mr-3"
                                    >
                                        Registrations ({event.currentRegistrations || 0})
                                    </button>
                                    <Link to={`/organizer/events/edit/${event._id}`} className="text-indigo-600 text-sm hover:underline">Edit</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Waitlist Modal */}
            {waitlistModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Registrations: {waitlistModal.eventName}</h3>
                            <button onClick={closeWaitlist} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {loadingWaitlist ? (
                                <div className="text-center py-10">Loading registrations...</div>
                            ) : waitlistModal.registrations.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">No registrations yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {waitlistModal.registrations.map((reg) => (
                                        <div key={reg._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-semibold text-gray-900">
                                                            {reg.user?.firstName} {reg.user?.lastName}
                                                        </h4>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${reg.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                            reg.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                reg.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {reg.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Email: {reg.user?.email} | Phone: {reg.user?.contactNumber}
                                                    </p>
                                                    {reg.ticketId && (
                                                        <p className="text-sm text-indigo-600 mt-1 font-mono">
                                                            Ticket: {reg.ticketId}
                                                        </p>
                                                    )}
                                                    {reg.teamName && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Team: {reg.teamName}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Registered: {new Date(reg.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                {reg.status === 'Pending' && (
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => updateStatus(reg._id, 'Confirmed')}
                                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(reg._id, 'Rejected')}
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
