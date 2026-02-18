import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../apiConfig';

const AdminDashboard = () => {
    const [clubs, setClubs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('clubs'); // 'clubs' or 'requests'
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [newClub, setNewClub] = useState({ name: '', category: 'Cultural', email: '', description: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/dashboard'); // Redirect non-admins
            return;
        }
        fetchClubs();
    }, [user, navigate]);

    const fetchClubs = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const { data } = await axios.get(`${API_URL}/admin/clubs`, config);
            setClubs(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching clubs", error);
        }
    };

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_URL}/admin/reset-requests`, config);
            setRequests(data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const handleProcessRequest = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`${API_URL}/admin/reset-request/${id}`,
                { status, adminComment: "Processed by Admin" }, config);

            if (status === 'Approved') {
                alert(`Request Approved! New Password: ${data.adminComment.split(': ')[1]}`);
            }
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || "Action failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete all events by this club too.")) return;
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.delete(`${API_URL}/admin/clubs/${id}`, config);
            fetchClubs(); // Refresh list
        } catch (error) {
            alert(error.response.data.message);
        }
    };

    const handleAddClub = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.post(`${API_URL}/admin/clubs`, newClub, config);
            setMessage('Club added successfully! Password: password123'); // Student hack: showing default password
            setNewClub({ name: '', category: 'Cultural', email: '', description: '' });
            fetchClubs();
        } catch (error) {
            setMessage('Error adding club: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleResetDatabase = async () => {
        if (!window.confirm("⚠️ DANGER: This will DELETE ALL DATA (Users, Events, Registrations) except your Admin account. \n\nIt will restore default clubs and create 'Rachit Mehta'. \n\nAre you sure?")) return;
        if (!window.confirm("Double Check: This cannot be undone. Proceed?")) return;

        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.post(`${API_URL}/admin/reset-database`, {}, config);
            alert("Database has been reset successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Reset failed", error);
            alert("Reset Failed: " + (error.response?.data?.message || error.message));
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-indigo-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-xl font-bold">Felicity Admin</h1>
                        <div className="flex items-center space-x-4">
                            <span>Welcome, Admin</span>
                            <button onClick={handleResetDatabase} className="bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-sm font-bold border border-orange-700 shadow-sm animate-pulse">
                                ⚠ Reset DB
                            </button>
                            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

                {/* Stats / Intro */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded shadow border-l-4 border-indigo-500">
                        <h3 className="text-gray-500 text-sm">Total Clubs</h3>
                        <p className="text-2xl font-bold">{clubs.length}</p>
                    </div>
                    {/* Add more stats later */}
                </div>

                <div className="mb-6 flex space-x-4 border-b">
                    <button onClick={() => setActiveTab('clubs')} className={`pb-2 px-4 ${activeTab === 'clubs' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Manage Clubs</button>
                    <button onClick={() => setActiveTab('requests')} className={`pb-2 px-4 ${activeTab === 'requests' ? 'border-b-2 border-indigo-600 font-bold text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        Password Requests ({requests.filter(r => r.status === 'Pending').length})
                    </button>
                </div>

                {activeTab === 'clubs' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Col: Add Club */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded shadow">
                                <h2 className="text-lg font-semibold mb-4 text-gray-800">Add New Club</h2>
                                {message && <div className={`p-2 mb-2 text-sm rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
                                <form onSubmit={handleAddClub}>
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-600">Club Name</label>
                                        <input type="text" required className="w-full border p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-600">Category</label>
                                        <select className="w-full border p-2 rounded"
                                            value={newClub.category} onChange={e => setNewClub({ ...newClub, category: e.target.value })}>
                                            <option value="Cultural">Cultural</option>
                                            <option value="Technical">Technical</option>
                                            <option value="Sports">Sports</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-600">Contact Email</label>
                                        <input type="email" required className="w-full border p-2 rounded"
                                            value={newClub.email} onChange={e => setNewClub({ ...newClub, email: e.target.value })} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block text-sm text-gray-600">Description</label>
                                        <textarea className="w-full border p-2 rounded" rows="3"
                                            value={newClub.description} onChange={e => setNewClub({ ...newClub, description: e.target.value })}></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Create Club</button>
                                </form>
                            </div>
                        </div>

                        {/* Right Col: Club List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded shadow">
                                <h2 className="text-lg font-semibold mb-4 text-gray-800">Managed Clubs</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clubs.map(club => (
                                                <tr key={club._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{club.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${club.category === 'Technical' ? 'bg-blue-100 text-blue-800' :
                                                                club.category === 'Cultural' ? 'bg-pink-100 text-pink-800' : 'bg-green-100 text-green-800'}`}>
                                                            {club.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{club.contactEmail}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => handleDelete(club._id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {requests.length === 0 && <li className="p-4 text-center text-gray-500">No requests found.</li>}
                            {requests.map((request) => (
                                <li key={request._id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-indigo-600 truncate">{request.organizer?.name} ({request.email})</p>
                                            <p className="flex items-center text-sm text-gray-500 mt-1">Reason: "{request.reason}"</p>
                                            <p className="text-xs text-gray-400 mt-1">Requested: {new Date(request.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                    request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {request.status}
                                            </span>

                                            {request.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleProcessRequest(request._id, 'Approved')}
                                                        className="font-medium text-green-600 hover:text-green-500 border border-green-600 px-3 py-1 rounded">
                                                        Reset
                                                    </button>
                                                    <button onClick={() => handleProcessRequest(request._id, 'Rejected')}
                                                        className="font-medium text-red-600 hover:text-red-500 border border-red-600 px-3 py-1 rounded">
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {request.adminComment && (
                                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                            <span className="font-bold">Admin Note:</span> {request.adminComment}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
