import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="fixed top-0 w-full z-50 glass border-b border-gray-200/20 px-6 py-3 flex justify-between items-center text-gray-800">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <Link to={user.role === 'admin' ? "/admin/dashboard" : user.role === 'organizer' ? "/organizer/dashboard" : "/dashboard"}
                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-80 transition-opacity">
                    Felicity Fest
                </Link>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-6 font-medium">
                {user.role === 'admin' ? (
                    <>
                        <Link to="/admin/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                        <Link to="/admin/dashboard?tab=clubs" className="hover:text-indigo-600 transition-colors">Manage Clubs</Link>
                        <Link to="/admin/dashboard?tab=requests" className="hover:text-indigo-600 transition-colors">Password Requests</Link>
                    </>
                ) : user.role === 'organizer' ? (
                    <>
                        <Link to="/organizer/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
                        <Link to="/organizer/events/create" className="hover:text-indigo-600 transition-colors">Create Event</Link>
                        <Link to="/organizer/dashboard?filter=ongoing" className="hover:text-indigo-600 transition-colors">Ongoing Events</Link>
                    </>
                ) : (
                    <>
                        <Link to="/events" className="hover:text-indigo-600 transition-colors">Browse Events</Link>
                        <Link to="/clubs" className="hover:text-indigo-600 transition-colors">Clubs</Link>
                        <Link to="/my-registrations" className="hover:text-indigo-600 transition-colors">My Tickets</Link>
                    </>
                )}
            </div>

            {/* Profile / Logout */}
            <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user.name?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 group-hover:text-indigo-600">
                            {user.role === 'organizer' ? 'Hello' : 'Welcome'}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-800">
                            {user.role === 'organizer' ? user.name : user.name?.split(' ')[0]}
                        </span>
                    </div>
                </Link>
                <Link to="/notifications" className="relative group p-2 rounded-full hover:bg-gray-100 transition-colors" title="Notifications">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </Link>
                <button
                    onClick={handleLogout}
                    className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95 shadow-md"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
