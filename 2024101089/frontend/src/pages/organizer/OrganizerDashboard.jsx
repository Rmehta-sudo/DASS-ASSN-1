import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../apiConfig';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
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
                                    <button className="text-indigo-600 text-sm hover:underline mr-3">Waitlist</button>
                                    <Link to={`/organizer/events/edit/${event._id}`} className="text-indigo-600 text-sm hover:underline">Edit</Link>
                                    {/* Link to detail page later */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerDashboard;
