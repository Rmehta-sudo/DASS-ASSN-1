import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const Profile = () => {
    const { user, login } = useAuth(); // login function updates context
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        collegeName: '',
        participantType: '',
        interests: [],
        following: []
    });
    const [organizers, setOrganizers] = useState([]);
    const [interestOptions] = useState([
        'Cultural', 'Technical', 'Sports', 'Music', 'Dance', 'Drama',
        'Photography', 'Literature', 'Gaming', 'Hackathons', 'Workshops',
        'Entrepreneurship', 'Art', 'Design', 'Coding', 'Robotics'
    ]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
        fetchOrganizers();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                contactNumber: data.contactNumber || '',
                collegeName: data.collegeName || '',
                participantType: data.participantType || '',
                interests: data.interests || [],
                following: data.following || []
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setLoading(false);
        }
    };

    const fetchOrganizers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/admin/clubs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrganizers(data);
        } catch (error) {
            console.error('Error fetching organizers:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleInterestToggle = (interest) => {
        const currentInterests = formData.interests;
        if (currentInterests.includes(interest)) {
            setFormData({ ...formData, interests: currentInterests.filter(i => i !== interest) });
        } else {
            setFormData({ ...formData, interests: [...currentInterests, interest] });
        }
    };

    const handleClubToggle = (clubId) => {
        const currentFollowing = formData.following;
        if (currentFollowing.includes(clubId)) {
            setFormData({ ...formData, following: currentFollowing.filter(id => id !== clubId) });
        } else {
            setFormData({ ...formData, following: [...currentFollowing, clubId] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(`${API_URL}/auth/profile`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Profile updated successfully!');
            // Update context
            // login(data, token is same); // useAuth login usually takes (userData, token)
            // But login function might redirect. User is already logged in.
            // We can just update localStorage manually if context doesn't have update function.
            // But let's check AuthContext. It usually has setUser.
            // If not, we just rely on fetchProfile next time.
            const storedUser = JSON.parse(localStorage.getItem('userInfo'));
            const updated = { ...storedUser, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            // Should verify if AuthContext exposes setUser. If not, page reload might be needed to reflect in Navbar.
            window.location.reload();
        } catch (error) {
            setMessage('Error updating profile: ' + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <div className="text-center mt-20">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            {message && (
                <div className={`p-4 rounded mb-6 ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 shadow rounded-lg">

                {/* Personal Details */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Read-only)</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm border p-2 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                            <input
                                type="text"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">College Name</label>
                            <input
                                type="text"
                                name="collegeName"
                                value={formData.collegeName}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Participant Type (Read-only)</label>
                            <input
                                type="text"
                                value={formData.participantType}
                                disabled
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm border p-2 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Interests */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Interests</h2>
                    <div className="flex flex-wrap gap-2">
                        {interestOptions.map(interest => (
                            <button
                                type="button"
                                key={interest}
                                onClick={() => handleInterestToggle(interest)}
                                className={`px-3 py-1 rounded-full text-sm font-medium border ${formData.interests.includes(interest)
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Following */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Following Clubs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {organizers.map(org => (
                            <div
                                key={org._id}
                                onClick={() => handleClubToggle(org._id)}
                                className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center ${formData.following.includes(org._id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <div>
                                    <h3 className="font-medium">{org.name}</h3>
                                    <p className="text-xs text-gray-500">{org.category}</p>
                                </div>
                                {formData.following.includes(org._id) && (
                                    <span className="text-indigo-600">✓</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
