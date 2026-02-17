import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const Clubs = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${API_URL}/admin/clubs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClubs(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching clubs:", error);
                setLoading(false);
            }
        };
        fetchClubs();
    }, []);

    if (loading) return <div className="text-center mt-20">Loading Clubs...</div>;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Clubs & Organizers</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                    <Link to={`/clubs/${club._id}`} key={club._id} className="block group">
                        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 h-full border border-transparent hover:border-indigo-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {club.name}
                                    </h2>
                                    <p className="text-sm text-gray-500">{club.category}</p>
                                </div>
                                <span className="text-2xl opacity-50">🏢</span>
                            </div>

                            <p className="text-gray-600 line-clamp-3 mb-4 text-sm">
                                {club.description || "No description provided."}
                            </p>

                            <div className="flex items-center text-sm text-gray-500 mt-auto">
                                <span className="mr-2">📧</span> {club.contactEmail}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Clubs;
