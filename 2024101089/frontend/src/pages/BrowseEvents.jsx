import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../apiConfig';

const BrowseEvents = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [typeFilter, setTypeFilter] = useState('All');
    const [showRecommended, setShowRecommended] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        // Filter logic
        let result = events;

        if (statusFilter !== 'All') {
            const now = new Date();
            result = result.filter(e => {
                const status = computeStatus(e);
                return status === statusFilter;
            });
        }

        if (typeFilter !== 'All') {
            result = result.filter(e => e.type === typeFilter);
        }

        if (searchTerm) {
            result = result.filter(e =>
                e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.organizer && e.organizer.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredEvents(result);
    }, [events, statusFilter, typeFilter, searchTerm]);

    const fetchEvents = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/events`);
            setEvents(data);
            setFilteredEvents(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching events", error);
            setLoading(false);
        }
    };

    const fetchRecommended = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/events/recommended`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(data);
            setFilteredEvents(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching recommended events", error);
            setLoading(false);
            // Fallback to normal events if error (e.g. not logged in)
            fetchEvents();
        }
    };

    const toggleRecommended = () => {
        if (!showRecommended) {
            setShowRecommended(true);
            fetchRecommended();
        } else {
            setShowRecommended(false);
            fetchEvents();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                    Discover Amazing Events
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Join the excitement at Felicity Fest. Browse workshops, hackathons, and cultural performances.
                </p>
            </div>

            {/* Search & Filter - Glassmorphic Bar */}
            <div className="glass p-4 rounded-2xl shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="flex gap-4 w-full md:w-auto items-center">
                    <button
                        onClick={toggleRecommended}
                        className={`px-4 py-2 rounded-lg border transition-all ${showRecommended
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white/50 border-gray-200 text-gray-700 hover:border-indigo-300'
                            }`}
                    >
                        ✨ For You
                    </button>

                    <select
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Open">Open</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Ended">Ended</option>
                        <option value="Full">Full</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Normal">Normal</option>
                        <option value="Team">Team</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map(event => (
                        <div key={event._id} className="glass rounded-2xl overflow-hidden card-hover flex flex-col h-full border border-gray-100">
                            {/* Placeholder Gradient Header instead of image for now */}
                            <div className={`h-32 bg-gradient-to-r ${getGradient(event.type)} flex items-center justify-center`}>
                                <span className="text-white font-bold text-2xl drop-shadow-md px-4 text-center">
                                    {event.organizer?.name || 'Club'}
                                </span>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${event.type === 'Team' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {event.type}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                                        {computeStatus(event)}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">{event.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{event.description}</p>

                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                                        <span>Date: {new Date(event.startDate).toLocaleDateString()}</span>
                                        <span>Fee: {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}</span>
                                    </div>

                                    <Link
                                        to={`/events/${event._id}`}
                                        className="block w-full text-center py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredEvents.length === 0 && !loading && (
                        <p className="col-span-full text-center text-gray-500 text-lg">No events found matching your criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// Helper for cooler gradients based on event type
const getGradient = (type) => {
    if (type === 'Team') return 'from-purple-500 to-indigo-600';
    return 'from-pink-500 to-orange-400';
};

const computeStatus = (event) => {
    const now = new Date();
    if (now > new Date(event.endDate)) return 'Ended';
    if (now >= new Date(event.startDate)) return 'Ongoing';
    if (event.registeredCount >= event.registrationLimit) return 'Full';
    return (new Date(event.deadline) < now) ? 'Closed' : 'Open';
};

export default BrowseEvents;
