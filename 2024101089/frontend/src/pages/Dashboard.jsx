import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // If admin, show admin features link
    const isAdmin = user?.role === 'admin';
    const isOrganizer = user?.role === 'organizer';

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-indigo-600">Felicity</h1>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">Hello, {user?.name}</span>
                            <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Logout</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex flex-col items-center justify-center">
                        <h2 className="text-2xl text-gray-400">Welcome to your Dashboard!</h2>
                        {isAdmin && (
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                                Go to Admin Panel
                            </button>
                        )}
                        {/* Add links for non-admin/organizer users */}
                        {!isAdmin && !isOrganizer && (
                            <div className="mt-8 bg-white p-6 rounded shadow text-center">
                                <h2 className="text-xl font-bold mb-4">For Students</h2>
                                <div className="space-y-4">
                                    <Link to="/events" className="block w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                        Browse Events
                                    </Link>
                                    <Link to="/my-registrations" className="block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                        My Registrations
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
