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

    const [activeTab, setActiveTab] = useState('Pending');
    const [feedbackModal, setFeedbackModal] = useState({ open: false, eventId: null, eventName: '', stats: null });
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [activeFeedbackFilter, setActiveFeedbackFilter] = useState(null);

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
        setActiveTab('Pending'); // Default to Pending

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

    const openFeedback = async (eventId, eventName) => {
        setLoadingFeedback(true);
        setFeedbackModal({ open: true, eventId, eventName, stats: null });
        setActiveFeedbackFilter(null);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_URL}/feedback/event/${eventId}`, config);
            setFeedbackModal({ open: true, eventId, eventName, stats: data });
            setLoadingFeedback(false);
        } catch (error) {
            console.error("Error fetching feedback", error);
            setLoadingFeedback(false);
        }
    };

    const updateStatus = async (registrationId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await axios.put(`${API_URL}/registrations/${registrationId}/status`, { status: newStatus }, config);

            // Refresh the waitlist data locally or re-fetch
            const updatedRegs = waitlistModal.registrations.map(r =>
                r._id === registrationId ? { ...r, status: newStatus } : r
            );
            setWaitlistModal(prev => ({ ...prev, registrations: updatedRegs }));

            // Also refresh events to update counts on cards
            fetchMyEvents();

            // alert(`Registration ${newStatus.toLowerCase()} successfully!`); // Optional toast
        } catch (error) {
            console.error("Error updating status", error);
            alert('Failed to update status');
        }
    };

    const closeWaitlist = () => {
        setWaitlistModal({ open: false, eventId: null, eventName: '', registrations: [] });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getFilteredRegistrations = () => {
        return waitlistModal.registrations.filter(r => r.status === activeTab);
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
                    <Link to="/organizer/events/create" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
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
                            <div key={event._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
                                <div className="p-5 border-b border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-indigo-600 line-clamp-1" title={event.name}>{event.name}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${event.status === 'Published' ? 'bg-green-100 text-green-700' :
                                            event.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                            }`}>{event.status}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
                                </div>
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-500">Total</span>
                                        <span className="font-semibold text-gray-700">{event.currentRegistrations} / {event.registrationLimit > 0 ? event.registrationLimit : '∞'}</span>
                                    </div>

                                    {/* Stats Bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden flex">
                                        <div className="bg-green-500 h-full" style={{ width: `${(event.stats?.confirmed / (event.stats?.total || 1)) * 100}%` }}></div>
                                        <div className="bg-yellow-400 h-full" style={{ width: `${(event.stats?.pending / (event.stats?.total || 1)) * 100}%` }}></div>
                                        <div className="bg-red-400 h-full" style={{ width: `${(event.stats?.rejected / (event.stats?.total || 1)) * 100}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <span>Pending: {event.stats?.pending || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span>Confirmed: {event.stats?.confirmed || 0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => openWaitlist(event._id, event.name)}
                                            className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors"
                                        >
                                            Registrations
                                        </button>
                                        <button
                                            onClick={() => openFeedback(event._id, event.name)}
                                            className="text-yellow-600 text-sm font-semibold hover:text-yellow-800 transition-colors"
                                        >
                                            Feedback
                                        </button>
                                    </div>
                                    <Link to={`/organizer/events/edit/${event._id}`} className="text-gray-500 text-sm hover:text-gray-900 transition-colors">Edit</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Waitlist Modal */}
            {waitlistModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="bg-white px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Registrations</h3>
                                <p className="text-sm text-gray-500">{waitlistModal.eventName}</p>
                            </div>
                            <button onClick={closeWaitlist} className="text-gray-400 hover:text-gray-600 text-2xl transition">&times;</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b px-6">
                            {['Pending', 'Confirmed', 'Rejected'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {waitlistModal.registrations.filter(r => r.status === tab).length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            {loadingWaitlist ? (
                                <div className="text-center py-10 text-gray-500">Loading registrations...</div>
                            ) : getFilteredRegistrations().length === 0 ? (
                                <div className="text-center py-16 text-gray-400 flex flex-col items-center">
                                    <span className="text-4xl mb-2">📭</span>
                                    <span>No {activeTab.toLowerCase()} registrations found.</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getFilteredRegistrations().map((reg) => (
                                        <div key={reg._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        {reg.user?.firstName} {reg.user?.lastName}
                                                    </h4>
                                                    {reg.teamName && (
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100 font-medium">
                                                            Team: {reg.teamName}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                                                    <p><span className="font-medium text-gray-500 w-16 inline-block">Email:</span> {reg.user?.email}</p>
                                                    <p><span className="font-medium text-gray-500 w-16 inline-block">Phone:</span> {reg.user?.contactNumber || 'N/A'}</p>
                                                    {reg.ticketId && <p><span className="font-medium text-gray-500 w-16 inline-block">Ticket:</span> <span className="font-mono text-gray-800">{reg.ticketId}</span></p>}
                                                    <p><span className="font-medium text-gray-500 w-16 inline-block">Date:</span> {new Date(reg.createdAt).toLocaleDateString()}</p>
                                                </div>

                                                {reg.merchandiseSelection && reg.merchandiseSelection.length > 0 && (
                                                    <div className="mt-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                        <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">Merchandise</p>
                                                        <ul className="text-sm text-indigo-900 list-disc list-inside">
                                                            {reg.merchandiseSelection.map((item, idx) => (
                                                                <li key={idx}>
                                                                    {item.quantity}x Item {item.itemId} {item.variant ? `(${item.variant})` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {reg.paymentProof && (
                                                    <div className="mt-3">
                                                        <a href={reg.paymentProof.startsWith('http') ? reg.paymentProof : `https://${reg.paymentProof}`} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors"
                                                        >
                                                            <span>📎 View Payment Proof</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[120px]">
                                                {reg.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(reg._id, 'Confirmed')}
                                                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 shadow-sm transition-transform active:scale-95"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(reg._id, 'Rejected')}
                                                            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {reg.status === 'Confirmed' && (
                                                    <button
                                                        onClick={() => updateStatus(reg._id, 'Rejected')}
                                                        className="px-4 py-2 text-red-600 text-sm hover:underline"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                                {reg.status === 'Rejected' && (
                                                    <button
                                                        onClick={() => updateStatus(reg._id, 'Pending')}
                                                        className="px-4 py-2 text-gray-500 text-sm hover:underline"
                                                    >
                                                        Re-evaluate
                                                    </button>
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
            {/* Feedback Modal */}
            {feedbackModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Feedback: {feedbackModal.eventName}</h3>
                            <button onClick={() => setFeedbackModal({ open: false, eventId: null, eventName: '', stats: null })} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            {loadingFeedback ? (
                                <div className="text-center py-10">Loading feedback...</div>
                            ) : !feedbackModal.stats || feedbackModal.stats.comments.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">No feedback received yet.</div>
                            ) : (
                                <div className="flex flex-col gap-6">
                                    {/* Summary Stats */}
                                    <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex flex-col items-center justify-center min-w-[150px]">
                                            <span className="text-5xl font-bold text-gray-800">{feedbackModal.stats.averageRating}</span>
                                            <div className="flex text-yellow-400 text-xl my-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i}>{i < Math.round(Number(feedbackModal.stats.averageRating)) ? '★' : '☆'}</span>
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500">{feedbackModal.stats.comments.length} Reviews</span>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = feedbackModal.stats.ratingDistribution[star] || 0;
                                                const total = feedbackModal.stats.comments.length; // Approximate total from comments/ratings sync
                                                const percent = total > 0 ? (count / total) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center text-sm gap-2">
                                                        <span className="w-3">{star}</span>
                                                        <span className="text-yellow-400">★</span>
                                                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-400" style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                        <span className="w-8 text-right text-gray-500">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Filter & Comments */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-800">Comments</h4>
                                            <select
                                                className="border rounded px-3 py-1 text-sm bg-white"
                                                onChange={(e) => setActiveFeedbackFilter(Number(e.target.value) || null)}
                                            >
                                                <option value="">All Ratings</option>
                                                <option value="5">5 Stars</option>
                                                <option value="4">4 Stars</option>
                                                <option value="3">3 Stars</option>
                                                <option value="2">2 Stars</option>
                                                <option value="1">1 Star</option>
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            {feedbackModal.stats.comments
                                                .filter(c => activeFeedbackFilter ? c.rating === activeFeedbackFilter : true)
                                                .map((comment, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                                                        <div className="flex justify-between mb-2">
                                                            <div className="flex text-yellow-500 text-sm">
                                                                {[...Array(comment.rating)].map((_, i) => <span key={i}>★</span>)}
                                                            </div>
                                                            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-gray-700 italic">"{comment.text}"</p>
                                                    </div>
                                                ))}
                                            {feedbackModal.stats.comments.filter(c => activeFeedbackFilter ? c.rating === activeFeedbackFilter : true).length === 0 && (
                                                <p className="text-center text-gray-500 py-4">No comments for this rating.</p>
                                            )}
                                        </div>
                                    </div>
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
