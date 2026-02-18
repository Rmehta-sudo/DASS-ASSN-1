import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
    const { user, login, setUser } = useAuth(); // login used to update context if needed
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: '',
        collegeName: '',
        participantType: '',
        role: '',
        interests: [],
        following: [],
        password: '',
        currentPassword: '',
        confirmPassword: '',
        // Organizer specific
        description: '',
        category: '',
        discordWebhook: ''
    });

    const [organizers, setOrganizers] = useState([]);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchOrganizers();
    }, []);

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

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const { data } = await axios.get(`${API_URL}/auth/profile`, config);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                contactNumber: data.contactNumber || '',
                collegeName: data.collegeName || '',
                participantType: data.participantType || '',
                role: data.role || '',
                interests: data.interests || [],
                following: data.following || [],
                password: '',
                following: data.following || [],
                password: '',
                confirmPassword: '',
                description: data.organizerDetails?.description || '',
                category: data.organizerDetails?.category || '',
                discordWebhook: data.organizerDetails?.discordWebhook || ''
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile");
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleInterestChange = (interest) => {
        let updatedInterests = [...formData.interests];
        if (updatedInterests.includes(interest)) {
            updatedInterests = updatedInterests.filter(i => i !== interest);
        } else {
            updatedInterests.push(interest);
        }
        setFormData({ ...formData, interests: updatedInterests });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            };

            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                contactNumber: formData.contactNumber,
                collegeName: formData.collegeName,
                interests: formData.interests,
            };

            if (formData.password) {
                updateData.password = formData.password;
                updateData.currentPassword = formData.currentPassword;
            }

            const { data } = await axios.put(`${API_URL}/auth/profile`, updateData, config);

            toast.success("Profile Updated Successfully");
            setEditMode(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '', currentPassword: '' }));

            // Update context and local storage
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || "Update failed");
        }
    };

    const handleClubToggle = (clubId) => {
        let updatedFollowing = [...formData.following];
        // formData.following originally contains IDs (from fetchProfile -> data.following) if NOT populated.
        // If it IS populated, we need to handle that. 
        // Based on authController, it returns user.following which is [ObjectId].
        // However, looking at the code I'm replacing, the previous code tried to access org.organizerName, implying it might have expected objects.
        // But the user complained about blank cells, confirming it probably wasn't working as objects or keys were wrong.
        // Let's assume user.following is array of IDs.

        // Safety check: map to strings for comparison
        const followingIds = updatedFollowing.map(f => typeof f === 'object' ? f._id : f);

        if (followingIds.includes(clubId)) {
            updatedFollowing = followingIds.filter(id => id !== clubId);
        } else {
            updatedFollowing = [...followingIds, clubId];
        }

        setFormData({ ...formData, following: updatedFollowing });
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    const availableInterests = ["Technical", "Cultural", "Sports", "Art", "Music", "Dance", "Literary", "Gaming"];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    {user?.role === 'organizer' ? `Hello ${user?.name}` : 'My Profile'}
                </h1>
                {!editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Read Only Fields */}
                    <div>
                        <label className="block text-gray-600 mb-1">Email</label>
                        <input type="text" value={formData.email} disabled className="w-full border p-2 rounded bg-gray-100" />
                    </div>
                    <div>
                        <label className="block text-gray-600 mb-1">Role</label>
                        <input type="text" value={formData.role} disabled className="w-full border p-2 rounded bg-gray-100 uppercase" />
                    </div>
                    {user?.role !== 'admin' && user?.role !== 'organizer' && (
                        <div>
                            <label className="block text-gray-600 mb-1">Participant Type</label>
                            <input type="text" value={formData.participantType} disabled className="w-full border p-2 rounded bg-gray-100" />
                        </div>
                    )}

                    {user?.role === 'organizer' && (
                        <div className="md:col-span-2 bg-indigo-50 p-4 rounded border border-indigo-100 mt-2">
                            <h3 className="font-bold text-indigo-800 mb-3">Club / Organizer Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-gray-600 mb-1">About the Club (Description)</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        disabled={!editMode}
                                        rows="3"
                                        className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                                        placeholder="Describe your club..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        disabled={!editMode}
                                        className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Cultural">Cultural</option>
                                        <option value="Technical">Technical</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-1">Discord Webhook URL</label>
                                    <input
                                        type="text"
                                        name="discordWebhook"
                                        value={formData.discordWebhook}
                                        onChange={handleChange}
                                        disabled={!editMode}
                                        placeholder="https://discord.com/api/webhooks/..."
                                        className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to use system default</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Editable Fields */}
                    {user?.role !== 'admin' && ( // Admin doesn't need personal details usually, but keeping name is fine. Hiding contact/college if needed
                        <>
                            <div>
                                <label className="block text-gray-600 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                                />
                            </div>
                        </>
                    )}

                    {user?.role !== 'admin' && (
                        <div>
                            <label className="block text-gray-600 mb-1">Contact Number</label>
                            <input
                                type="text"
                                name="contactNumber"
                                value={formData.contactNumber}
                                onChange={handleChange}
                                disabled={!editMode}
                                className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                            />
                        </div>
                    )}

                    {user?.role !== 'admin' && user?.role !== 'organizer' && (
                        <div>
                            <label className="block text-gray-600 mb-1">College / Organization</label>
                            <input
                                type="text"
                                name="collegeName"
                                value={formData.collegeName}
                                onChange={handleChange}
                                disabled={!editMode}
                                className={`w-full border p-2 rounded ${!editMode ? 'bg-gray-100' : 'bg-white border-indigo-300'}`}
                            />
                        </div>
                    )}
                </div>

                <hr className="my-6 border-gray-200" />

                {(user?.role !== 'admin' && user?.role !== 'organizer') && (
                    <>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-3">Interests</h2>
                            <div className="flex flex-wrap gap-2">
                                {availableInterests.map(interest => (
                                    <button
                                        type="button"
                                        key={interest}
                                        onClick={() => editMode && handleInterestChange(interest)}
                                        disabled={!editMode}
                                        className={`px-4 py-2 rounded-full border ${formData.interests.includes(interest)
                                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                            : 'bg-white text-gray-600 border-gray-300'
                                            } ${editMode ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-3">Following Clubs</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                {organizers.map(org => {
                                    const isFollowing = formData.following.some(id => (typeof id === 'object' ? id._id : id) === org._id);
                                    return (
                                        <div
                                            key={org._id}
                                            onClick={() => editMode && handleClubToggle(org._id)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all flex justify-between items-start
                                                ${isFollowing
                                                    ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-indigo-300'
                                                }
                                                ${!editMode ? 'cursor-default' : ''}
                                            `}
                                        >
                                            <div>
                                                <h3 className="font-medium text-gray-900">{org.name}</h3>
                                                <p className="text-xs text-gray-500 mt-1">{org.category}</p>
                                            </div>
                                            {isFollowing && (
                                                <span className="text-indigo-600">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {editMode && (
                    <>
                        <hr className="my-6 border-gray-200" />
                        {user?.role !== 'organizer' && (
                            <div className="mb-6 bg-red-50 p-4 rounded border border-red-100">
                                <h2 className="text-lg font-semibold text-red-700 mb-3">Change Password</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-gray-600 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded bg-white"
                                            placeholder="Required to change password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded bg-white"
                                            placeholder="Leave blank to keep current"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded bg-white"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 mt-6">
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                            >
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditMode(false);
                                    fetchProfile(); // Reset form
                                }}
                                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default Profile;
