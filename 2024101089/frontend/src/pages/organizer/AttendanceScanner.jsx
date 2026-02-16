import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../apiConfig';

const AttendanceScanner = () => {
    const [ticketId, setTicketId] = useState('');
    const [status, setStatus] = useState(''); // 'success', 'error', ''
    const [message, setMessage] = useState('');
    const [scannedData, setScannedData] = useState(null);
    const navigate = useNavigate();

    const handleScan = async (e) => {
        e.preventDefault();
        setStatus('');
        setMessage('');
        setScannedData(null);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/attendance/mark`, {
                ticketId
            }, { headers: { Authorization: `Bearer ${token}` } });

            setStatus('success');
            setMessage(data.message);
            setScannedData(data);
            setTicketId(''); // Clear for next scan
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || err.message);
            if (err.response?.data?.error) {
                setMessage(`${err.response.data.message}: ${err.response.data.error}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-indigo-800 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Attendance Scanner</h2>
                    <button onClick={() => navigate('/organizer/dashboard')} className="text-indigo-200 hover:text-white text-sm">
                        Exit
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleScan} className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scan Ticket (Enter ID)</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value)}
                                placeholder="FEL-XXXXXXXX"
                                className="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm p-3 font-mono text-lg uppercase"
                                autoFocus
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700">
                                Verify
                            </button>
                        </div>
                    </form>

                    {/* Status Display */}
                    {status === 'success' && scannedData && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-green-900">Verified!</h3>
                            <p className="text-sm text-green-600 mb-2">{message}</p>

                            <div className="text-left mt-4 border-t pt-3">
                                <p><strong>User:</strong> {scannedData.user.firstName} {scannedData.user.lastName}</p>
                                <p><strong>Email:</strong> {scannedData.user.email}</p>
                                <p><strong>College:</strong> {scannedData.user.collegeName || 'N/A'}</p>
                                <p><strong>Event:</strong> {scannedData.event.name}</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-red-900">Invalid / Error</h3>
                            <p className="text-sm text-red-600">{message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceScanner;
