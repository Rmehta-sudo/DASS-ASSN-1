import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_URL } from '../../apiConfig';

const ResetRequest = () => {
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            await axios.post(`${API_URL}/admin/reset-request`, { email, reason });
            setMessage('Request submitted successfully. Admin will review it.');
            setEmail('');
            setReason('');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit request");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-xl w-full max-w-md">
                <h3 className="text-2xl font-bold text-center text-indigo-600">Request Password Reset</h3>
                <p className="mt-2 text-center text-sm text-gray-600">For Club/Organizer Accounts</p>

                {message && <div className="p-2 my-2 text-sm text-green-700 bg-green-100 rounded">{message}</div>}
                {error && <div className="p-2 my-2 text-sm text-red-700 bg-red-100 rounded">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <label className="block" htmlFor="email">Club Email</label>
                        <input
                            type="email"
                            placeholder="Club Contact Email"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-4">
                        <label className="block">Reason</label>
                        <textarea
                            placeholder="Reason for reset"
                            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-600"
                            rows="3"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-baseline justify-between">
                        <button className="px-6 py-2 mt-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-900 w-full">Submit Request</button>
                    </div>
                    <div className="mt-4 text-sm text-center">
                        <Link to="/login" className="text-indigo-600 hover:underline">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetRequest;
