import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const ClubDetails = () => {
    const { id } = useParams();
    const [club, setClub] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                // Fetch Club Details
                const clubRes = await axios.get(`${API_URL}/admin/clubs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClub(clubRes.data);

                // Fetch Club Events
                // Using the updated getEvents with query param
                const eventsRes = await axios.get(`${API_URL}/events?organizer=${id}`);
                // Note: /api/events is PUBLIC, so token isn't strictly required, but sending it is fine if using interceptors.
                // However, updated logic in eventController didn't remove 'Draft' filter, so only Published events appear. correct.
                setEvents(eventsRes.data);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="text-center mt-20">Loading...</div>;
    if (!club) return <div className="text-center mt-20 text-red-500">Club not found</div>;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="bg-white shadow rounded-lg p-8 mb-10 border-l-4 border-indigo-600">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{club.name}</h1>
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full font-medium">
                            {club.category}
                        </span>
                    </div>
                    <div className="text-right text-gray-600">
                        <p className="flex items-center justify-end gap-2">
                            <span>📧</span> {club.contactEmail}
                        </p>
                    </div>
                </div>
                <p className="mt-6 text-gray-700 text-lg leading-relaxed">
                    {club.description || "No description available for this club."}
                </p>
            </div>

            {/* Events Section */}
            <div className="space-y-12">
                {/* Upcoming Events */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        📅 <span className="underline decoration-indigo-500 decoration-4 underline-offset-4">Upcoming Events</span>
                    </h2>

                    {events.filter(e => new Date(e.startDate) >= new Date()).length === 0 ? (
                        <p className="text-gray-500 italic">No upcoming events scheduled at the moment.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.filter(e => new Date(e.startDate) >= new Date()).map(event => (
                                <EventCard key={event._id} event={event} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Events */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        🕰️ <span className="underline decoration-gray-400 decoration-4 underline-offset-4">Past Events</span>
                    </h2>

                    {events.filter(e => new Date(e.startDate) < new Date()).length === 0 ? (
                        <p className="text-gray-500 italic">No past events.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                            {events.filter(e => new Date(e.startDate) < new Date()).map(event => (
                                <EventCard key={event._id} event={event} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

// Extracted Card Component for reuse
const EventCard = ({ event }) => (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-gray-100">
        <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${event.type === 'Hackathon' ? 'bg-purple-100 text-purple-800' :
                    event.type === 'Merchandise' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {event.type}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ml-2 ${event.status === 'Completed' ? 'bg-gray-200 text-gray-800' :
                        event.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-green-50 text-green-800'
                    }`}>
                    {event.status}
                </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>

            <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>🗓 {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p>📍 {event.location}</p>
            </div>

            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {event.description}
            </p>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 mt-auto">
            <Link to={`/events/${event._id}`} className="block w-full text-center bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded hover:bg-gray-50 transition-colors hover:text-indigo-600 hover:border-indigo-300">
                View Details
            </Link>
        </div>
    </div>
);
