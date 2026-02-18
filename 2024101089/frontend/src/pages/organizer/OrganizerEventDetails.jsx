import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../apiConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DiscussionForum from '../../components/DiscussionForum';
import { useAuth } from '../../context/AuthContext';

const OrganizerEventDetails = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, participants, analytics, discussion
    const { user } = useAuth();

    // participants filter
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [eventRes, regRes, analyticsRes] = await Promise.all([
                axios.get(`${API_URL}/events/${id}`, config),
                axios.get(`${API_URL}/registrations/event/${id}`, config),
                axios.get(`${API_URL}/events/${id}/analytics`, config).catch(() => ({ data: null }))
            ]);

            setEvent(eventRes.data);
            setRegistrations(regRes.data);
            setAnalytics(analyticsRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load event data");
            setLoading(false);
        }
    };

    const handleDownloadCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/events/${id}/csv`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', // Important
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/yi, '_')}_participants.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("CSV Download Error:", error);
            toast.error("Failed to download CSV");
        }
    };

    const getFilteredRegistrations = () => {
        return registrations.filter(reg => {
            const matchesStatus = filterStatus === 'All' || reg.status === filterStatus;
            const matchesSearch =
                reg.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reg.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reg.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (reg.ticketId && reg.ticketId.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesStatus && matchesSearch;
        });
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!event) return <div className="p-10 text-center text-red-500">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <ToastContainer />
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-sm breadcrumbs text-gray-500 mb-2">
                                <Link to="/organizer/dashboard" className="hover:text-indigo-600">Dashboard</Link> / Event Details
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                            <div className="flex gap-3 mt-2">
                                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${event.status === 'Published' ? 'bg-green-100 text-green-800' :
                                    event.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>{event.status}</span>
                                <span className="text-gray-500 text-sm flex items-center">
                                    📅 {new Date(event.startDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link to={`/organizer/events/edit/${id}`} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                                Edit Event
                            </Link>
                            <button onClick={handleDownloadCSV} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                📥 Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {['Overview', 'Analytics', 'Participants', 'Discussion'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.toLowerCase()
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Overview</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                    <p className="mt-1 text-gray-900 whitespace-pre-line">{event.description}</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Type</h4>
                                        <p className="mt-1 text-gray-900">{event.type}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Location</h4>
                                        <p className="mt-1 text-gray-900">{event.location}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Price</h4>
                                        <p className="mt-1 text-gray-900">₹{event.registrationFee}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Limits</h4>
                                        <p className="mt-1 text-gray-900">
                                            {event.currentRegistrations} / {event.registrationLimit || '∞'} Participants
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && analytics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h4 className="text-sm font-medium text-gray-500 uppercase">Total Revenue</h4>
                                <p className="mt-2 text-3xl font-bold text-green-600">₹{analytics.totalRevenue}</p>
                            </div>
                            <div className="bg-white shadow rounded-lg p-6">
                                <h4 className="text-sm font-medium text-gray-500 uppercase">Total Registrations</h4>
                                <p className="mt-2 text-3xl font-bold text-indigo-600">{analytics.totalRegistrations}</p>
                            </div>
                            <div className="bg-white shadow rounded-lg p-6">
                                <h4 className="text-sm font-medium text-gray-500 uppercase">Conversion Rate</h4>
                                <p className="mt-2 text-3xl font-bold text-blue-600">
                                    {analytics.totalRegistrations > 0
                                        ? Math.round((analytics.confirmedRegistrations / analytics.totalRegistrations) * 100)
                                        : 0}%
                                </p>
                            </div>

                            <div className="md:col-span-3 bg-white shadow rounded-lg p-6">
                                <h4 className="text-lg font-bold text-gray-800 mb-4">Daily Registrations</h4>
                                <div className="h-64 flex items-end gap-2 border-b border-gray-200 pb-4">
                                    {Object.entries(analytics.dailyStats).length > 0 ? Object.entries(analytics.dailyStats).map(([date, count]) => (
                                        <div key={date} className="flex-1 flex flex-col items-center group">
                                            <div
                                                className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t"
                                                style={{ height: `${(count / Math.max(...Object.values(analytics.dailyStats))) * 200}px` }}
                                            ></div>
                                            <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left translate-y-2">{date}</span>
                                            <div className="absolute -mt-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {count} regs
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                                            No data available yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'participants' && (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search participants..."
                                        className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-64"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                </div>
                                <select
                                    className="border rounded-md px-3 py-2 bg-white"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getFilteredRegistrations().map(reg => (
                                            <tr key={reg._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{reg.ticketId || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{reg.user?.firstName} {reg.user?.lastName}</div>
                                                    <div className="text-xs text-gray-500">Reg: {new Date(reg.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{reg.user?.email}</div>
                                                    <div className="text-xs text-gray-500">{reg.user?.contactNumber}</div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                        reg.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {reg.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {getFilteredRegistrations().length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                                    No participants found matching your criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'discussion' && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <DiscussionForum eventId={event._id} user={user} isOrganizer={true} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerEventDetails;
