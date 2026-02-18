import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const FeedbackForm = ({ eventId, registrationStatus, eventEndDate }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [reviews, setReviews] = useState([]);
    const [average, setAverage] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const isEventEnded = new Date() > new Date(eventEndDate);
    const canReview = registrationStatus === 'Confirmed' && isEventEnded && !submitted;

    useEffect(() => {
        fetchFeedback();
    }, [eventId]);

    const fetchFeedback = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/feedback/${eventId}`);
            setReviews(data.reviews);
            setAverage(data.average);
        } catch (err) {
            console.error("Error fetching feedback:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/feedback/${eventId}`, {
                rating,
                comment
            }, { headers: { Authorization: `Bearer ${token}` } });

            setSubmitted(true);
            setComment("");
            fetchFeedback(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || "Error submitting feedback");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8 border border-gray-200">
            <h3 className="text-xl font-bold mb-4">Event Feedback & Ratings</h3>

            {/* Summary */}
            <div className="flex items-center mb-6">
                <div className="text-4xl font-bold text-yellow-500 mr-2">{average || 0}</div>
                <div className="text-gray-500">/ 5 ({reviews.length} reviews)</div>
            </div>

            {/* Submission Form */}
            {canReview ? (
                <form onSubmit={handleSubmit} className="mb-8 border-b pb-6">
                    <h4 className="font-semibold mb-2">Leave your anonymous feedback</h4>
                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                    <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Rating</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="block w-full border border-gray-300 rounded p-2"
                        >
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Good</option>
                            <option value="3">3 - Average</option>
                            <option value="2">2 - Poor</option>
                            <option value="1">1 - Terrible</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm text-gray-700 mb-1">Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            rows="3"
                            className="block w-full border border-gray-300 rounded p-2"
                            placeholder="Share your experience..."
                        ></textarea>
                    </div>

                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                        Submit Feedback
                    </button>
                </form>
            ) : (
                <div className="mb-6 text-gray-500 italic text-sm">
                    {!isEventEnded ? "Feedback will open after the event ends." :
                        registrationStatus !== 'Confirmed' ? "Only confirmed attendees can leave feedback." :
                            "Thank you for your feedback!"}
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.map((rev) => (
                    <div key={rev._id} className="bg-gray-50 p-4 rounded">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center">
                                <span className="text-yellow-500 font-bold mr-2">Rating: {rev.rating}/5</span>
                                <span className="text-gray-400 text-xs">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <p className="text-gray-700 mt-2 text-sm">{rev.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedbackForm;
