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
        confirmPassword: ''
    });

    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

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
                confirmPassword: ''
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
            }

            const { data } = await axios.put(`${API_URL}/auth/profile`, updateData, config);

            toast.success("Profile Updated Successfully");
            setEditMode(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

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

    const handleUnfollow = async (organizerId) => {
        try {
            // Optimistic update
            const updatedFollowing = formData.following.filter(org => org._id !== organizerId);
            setFormData(prev => ({ ...prev, following: updatedFollowing }));

            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            };

            // Should verify if API expects just IDs or objects. updatePreferences usually takes IDs.
            // Following list from profile GET might be populated objects. 
            // So we need to map to IDs for the PUT request if the backend expects IDs.

            const followingIds = updatedFollowing.map(org => org._id);

            await axios.put(`${API_URL}/auth/preferences`, { following: followingIds }, config);
            toast.success("Unfollowed successfully");
        } catch (error) {
            console.error("Unfollow error:", error);
            toast.error("Failed to unfollow");
            fetchProfile(); // Revert on error
        }
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    const availableInterests = ["Technical", "Cultural", "Sports", "Art", "Music", "Dance", "Literary", "Gaming"];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
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
                    <div>
                        <label className="block text-gray-600 mb-1">Participant Type</label>
                        <input type="text" value={formData.participantType} disabled className="w-full border p-2 rounded bg-gray-100" />
                    </div>

                    {/* Editable Fields */}
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
                </div>

                <hr className="my-6 border-gray-200" />

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
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold">Following</h2>
                        <Link to="/clubs" className="text-indigo-600 hover:underline text-sm font-medium">
                            Browse Clubs to Follow &rarr;
                        </Link>
                    </div>
                    {formData.following.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded border border-gray-100">
                            <p className="text-gray-500 italic mb-2">You are not following any clubs yet.</p>
                            <Link to="/clubs" className="inline-block bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded hover:bg-indigo-50 transition">
                                Browse Clubs
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {formData.following.map(org => (
                                <div key={org._id || org} className="border p-4 rounded shadow-sm flex justify-between items-center bg-white transition hover:shadow-md">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">
                                            {typeof org === 'object' ? org.organizerName : 'Club ID: ' + org}
                                        </h4>
                                        {typeof org === 'object' && org.category && (
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                                                {org.category}
                                            </span>
                                        )}
                                    </div>
                                    {editMode && (
                                        <button
                                            type="button"
                                            onClick={() => handleUnfollow(org._id || org)}
                                            className="ml-2 text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full hover:bg-red-100 transition"
                                            title="Unfollow"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editMode && (
                    <>
                        <hr className="my-6 border-gray-200" />
                        <div className="mb-6 bg-red-50 p-4 rounded border border-red-100">
                            <h2 className="text-lg font-semibold text-red-700 mb-3">Change Password</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
