import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import EventCreate from './pages/organizer/EventCreate';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import ResetRequest from './pages/organizer/ResetRequest';
import AttendanceScanner from './pages/organizer/AttendanceScanner';
import Onboarding from './pages/Onboarding';
import EventEdit from './pages/organizer/EventEdit';
import OrganizerEventDetails from './pages/organizer/OrganizerEventDetails';
import Profile from './pages/Profile';
import Clubs from './pages/Clubs';
import ClubDetails from './pages/ClubDetails';
import Navbar from './components/Navbar';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// A simple PrivateRoute component to protect dashboard
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pt-20"> {/* Add padding top for navbar */}
                    <Navbar />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/reset-request" element={<ResetRequest />} />
                        <Route path="/onboarding" element={
                            <PrivateRoute>
                                <Onboarding />
                            </PrivateRoute>
                        } />
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <Profile />
                            </PrivateRoute>
                        } />
                        <Route path="/clubs" element={
                            <PrivateRoute>
                                <Clubs />
                            </PrivateRoute>
                        } />
                        <Route path="/clubs/:id" element={
                            <PrivateRoute>
                                <ClubDetails />
                            </PrivateRoute>
                        } />
                        <Route path="/" element={<Navigate to="/dashboard" />} />

                        {/* Protected Routes */}
                        <Route path="/dashboard" element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/dashboard" element={
                            <PrivateRoute>
                                <AdminDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/organizer/dashboard" element={
                            <PrivateRoute>
                                <OrganizerDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/organizer/events/create" element={
                            <PrivateRoute>
                                <EventCreate />
                            </PrivateRoute>
                        } />
                        <Route path="/organizer/events/edit/:id" element={
                            <PrivateRoute>
                                <EventEdit />
                            </PrivateRoute>
                        } />
                        <Route path="/organizer/events/:id" element={
                            <PrivateRoute>
                                <OrganizerEventDetails />
                            </PrivateRoute>
                        } />
                        <Route path="/organizer/scanner" element={
                            <PrivateRoute>
                                <AttendanceScanner />
                            </PrivateRoute>
                        } />
                        <Route path="/events" element={
                            <PrivateRoute>
                                <BrowseEvents />
                            </PrivateRoute>
                        } />
                        <Route path="/events/:id" element={
                            <PrivateRoute>
                                <EventDetails />
                            </PrivateRoute>
                        } />
                        <Route path="/my-registrations" element={
                            <PrivateRoute>
                                <MyRegistrations />
                            </PrivateRoute>
                        } />

                        {/* 404 Route */}
                        <Route path="*" element={<div className="p-10 text-center"><h1>404 - Page Not Found</h1></div>} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
