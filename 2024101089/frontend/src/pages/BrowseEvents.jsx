import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';

const BrowseEvents = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [typeFilter, setTypeFilter] = useState('All');
    const [eligibilityFilter, setEligibilityFilter] = useState('All');

    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [followedOnly, setFollowedOnly] = useState(false);

    const [showRecommended, setShowRecommended] = useState(false);
    const [trendingEvents, setTrendingEvents] = useState([]);

    const { user } = useAuth(); // Need user for 'Following' filter

    useEffect(() => {
        fetchEvents();
        fetchTrending();
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

        if (eligibilityFilter !== 'All') {
            result = result.filter(e => e.eligibility === eligibilityFilter);
        }

        if (startDateFilter) {
            const start = new Date(startDateFilter);
            result = result.filter(e => new Date(e.startDate) >= start);
        }

        if (endDateFilter) {
            const end = new Date(endDateFilter);
            // Include end date fully (end of day)
            end.setHours(23, 59, 59, 999);
            result = result.filter(e => {
                const eventDate = new Date(e.startDate); // Primary check on start date
                return eventDate <= end;
            });
        }

        if (followedOnly && user) {
            result = result.filter(e => user.following.includes(e.organizer?._id));
        }

        setFilteredEvents(result);
    }, [events, statusFilter, typeFilter, searchTerm, eligibilityFilter, startDateFilter, endDateFilter, followedOnly, user]);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const { data } = await axios.get(`${API_URL}/events`, config);
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

    const fetchTrending = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/events/trending`);
            setTrendingEvents(data);
        } catch (error) {
            console.error("Error fetching trending events", error);
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

            {/* Trending Section */}
            {trendingEvents.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="text-orange-500 font-bold">Trending</span> Now
                    </h3>
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                        {trendingEvents.map(event => (
                            <div key={event._id} className="min-w-[280px] md:min-w-[320px] bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex-shrink-0">
                                <div className={`h-16 bg-gradient-to-r ${getGradient(event.type)} flex items-center justify-center`}>
                                    <span className="text-white font-bold text-sm drop-shadow">{event.type}</span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-gray-900 mb-1 truncate">{event.name}</h4>
                                    <p className="text-sm text-gray-500 mb-2 truncate">{event.description}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-600 mt-3">
                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                            {event.registrationCount || 'Many'} joined
                                        </span>
                                        <Link to={`/events/${event._id}`} className="text-indigo-600 font-semibold hover:underline">View</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter - Glassmorphic Bar */}
            <div className="glass p-6 rounded-2xl shadow-sm mb-10 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-bold">@</span>
                        <input
                            type="text"
                            placeholder="Search events or organizers..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white/50 backdrop-blur-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={toggleRecommended}
                        className={`px-5 py-2.5 rounded-xl border font-medium transition-all flex items-center gap-2 ${showRecommended
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white/50 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-white'
                            }`}
                    >
                        <span>All Events</span> For You
                    </button>
                    {user && (
                        <button
                            onClick={() => setFollowedOnly(!followedOnly)}
                            className={`px-5 py-2.5 rounded-xl border font-medium transition-all flex items-center gap-2 ${followedOnly
                                ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                : 'bg-white/50 border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-white'
                                }`}
                        >
                            <span>Following</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <select
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white/50 focus:ring-2 focus:ring-indigo-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Open">Open (Register Now)</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Ended">Ended</option>
                    </select>

                    <select
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white/50 focus:ring-2 focus:ring-indigo-500"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Normal">Normal Events</option>
                        <option value="Team">Team Events</option>
                        <option value="Merchandise">Merchandise</option>
                    </select>

                    <select
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white/50 focus:ring-2 focus:ring-indigo-500"
                        value={eligibilityFilter}
                        onChange={(e) => setEligibilityFilter(e.target.value)}
                    >
                        <option value="All">All Eligibility</option>
                        <option value="Open to All">Open to All</option>
                        <option value="IIIT Only">IIIT Only</option>
                    </select>

                    <div className="flex items-center gap-2 col-span-1 md:col-span-1">
                        <div className="flex flex-col w-full">
                            <span className="text-xs text-gray-500 ml-1">From</span>
                            <input
                                type="date"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 col-span-1 md:col-span-1">
                        <div className="flex flex-col w-full">
                            <span className="text-xs text-gray-500 ml-1">To</span>
                            <input
                                type="date"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white/50 text-sm"
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                            />
                        </div>
                    </div>
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
                            {/* Placeholder Gradient Header instead of image for now */}
                            <div className={`h-20 bg-gradient-to-r ${getGradient(event.type)} flex items-center justify-center`}>
                                <span className="text-white font-bold text-lg drop-shadow-md px-4 text-center">
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
    if (type === 'Team') return 'from-slate-700 to-slate-900';
    return 'from-gray-700 to-gray-900';
};

const computeStatus = (event) => {
    const now = new Date();
    if (now > new Date(event.endDate)) return 'Ended';
    if (now >= new Date(event.startDate)) return 'Ongoing';
    if (event.registeredCount >= event.registrationLimit) return 'Full';
    return (new Date(event.deadline) < now) ? 'Closed' : 'Open';
};

export default BrowseEvents;
