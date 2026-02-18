import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const Onboarding = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedClubs, setSelectedClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Predefined interest areas
    const interestOptions = [
        'Cultural', 'Technical', 'Sports', 'Music', 'Dance', 'Drama',
        'Photography', 'Literature', 'Gaming', 'Hackathons', 'Workshops',
        'Entrepreneurship', 'Art', 'Design', 'Coding', 'Robotics'
    ];

    useEffect(() => {
        // Redirect if not a participant or already logged in before
        if (!user || user.role !== 'participant') {
            navigate('/dashboard');
            return;
        }

        fetchOrganizers();
    }, [user, navigate]);

    const fetchOrganizers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/admin/clubs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrganizers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching organizers:', error);
            setLoading(false);
        }
    };

    const handleInterestToggle = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const handleClubToggle = (clubId) => {
        if (selectedClubs.includes(clubId)) {
            setSelectedClubs(selectedClubs.filter(id => id !== clubId));
        } else {
            setSelectedClubs([...selectedClubs, clubId]);
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/auth/preferences`, {
                interests: selectedInterests,
                following: selectedClubs
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local user info
            const updatedUser = { ...user, interests: selectedInterests, following: selectedClubs };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences. You can set them later in your profile.');
            navigate('/dashboard');
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Felicity! 🎉</h1>
                        <p className="text-gray-600">Let's personalize your experience (you can skip this and set preferences later)</p>
                    </div>

                    {/* Interests Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">🎯</span> Areas of Interest
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {interestOptions.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => handleInterestToggle(interest)}
                                    className={`py-2 px-4 rounded-lg border-2 transition-all text-sm font-medium
                                        ${selectedInterests.includes(interest)
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clubs/Organizers Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="mr-2">🏛️</span> Follow Clubs & Organizers
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                            {organizers.map(org => (
                                <div
                                    key={org._id}
                                    onClick={() => handleClubToggle(org._id)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all
                                        ${selectedClubs.includes(org._id)
                                            ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                            : 'bg-white border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                <span className="inline-block bg-gray-100 px-2 py-0.5 rounded">
                                                    {org.category}
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{org.description}</p>
                                        </div>
                                        {selectedClubs.includes(org._id) && (
                                            <div className="ml-2 text-indigo-600">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSkip}
                            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Skip for now
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
                        >
                            Continue to Dashboard →
                        </button>
                    </div>

                    {/* Summary */}
                    {(selectedInterests.length > 0 || selectedClubs.length > 0) && (
                        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                            <p className="text-sm text-indigo-800">
                                ✨ You've selected <strong>{selectedInterests.length}</strong> interest(s) and
                                following <strong>{selectedClubs.length}</strong> club(s)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
