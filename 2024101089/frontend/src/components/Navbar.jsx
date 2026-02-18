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
                <Link to="/dashboard" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-80 transition-opacity">
                    Felicity Fest
                </Link>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-6 font-medium">
                <Link to="/events" className="hover:text-indigo-600 transition-colors">Browse Events</Link>
                <Link to="/clubs" className="hover:text-indigo-600 transition-colors">Clubs</Link>
                <Link to="/my-registrations" className="hover:text-indigo-600 transition-colors">My Tickets</Link>

                {user.role === 'admin' && (
                    <Link to="/admin/dashboard" className="text-purple-600 hover:text-purple-800">Admin Panel</Link>
                )}

                {user.organizerId && (
                    <Link to="/organizer/dashboard" className="text-purple-600 hover:text-purple-800">Organizer Panel</Link>
                )}
            </div>

            {/* Profile / Logout */}
            <div className="flex items-center gap-4">
                <Link to="/profile" className="hidden sm:flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {user.name?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 group-hover:text-indigo-600">Welcome</span>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-800">{user.name?.split(' ')[0]}</span>
                    </div>
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
