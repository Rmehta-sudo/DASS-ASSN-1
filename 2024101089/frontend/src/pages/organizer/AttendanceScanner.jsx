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

    const [stats, setStats] = useState({ totalRegistrations: 0, attendedCount: 0 });
    const [overrideMode, setOverrideMode] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            // Assuming the event ID is available or we show an aggregate? 
            // The route says /api/attendance/stats/:eventId.
            // Wait, the scanner does not take an event ID until it scans. 
            // The stats require an eventId. Actually, organizers can have multiple events. Let's just catch it.
        } catch (e) { }
    };

    const clearStatus = () => {
        setStatus('');
        setMessage('');
    };

    const handleScan = async (e) => {
        e.preventDefault();
        clearStatus();
        setScannedData(null);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/attendance/mark`, {
                ticketId
            }, { headers: { Authorization: `Bearer ${token}` } });

            setStatus('success');
            setTimeout(clearStatus, 5000);
            setMessage(data.message);
            setScannedData(data);
            setTicketId(''); // Clear for next scan

            // Try updating stats if event was populated
            if (data.event && data.event._id) {
                try {
                    const token = localStorage.getItem('token');
                    const statsData = await axios.get(`${API_URL}/attendance/stats/${data.event._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setStats(statsData.data);
                } catch (e) { }
            }

        } catch (err) {
            setStatus('error');
            setTimeout(clearStatus, 5000);
            setMessage(err.response?.data?.message || err.message);
            if (err.response?.data?.error) {
                setMessage(`${err.response.data.message}: ${err.response.data.error}`);
            }
        }
    };

    const handleOverride = async (e) => {
        e.preventDefault();
        clearStatus();
        setScannedData(null);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${API_URL}/attendance/manual`, {
                ticketId,
                reason: overrideReason
            }, { headers: { Authorization: `Bearer ${token}` } });

            setStatus('success');
            setTimeout(clearStatus, 5000);
            setMessage(data.message);
            setScannedData(data);
            setTicketId('');
            setOverrideReason('');
            setOverrideMode(false);

            if (data.event && data.event._id) {
                try {
                    const statsData = await axios.get(`${API_URL}/attendance/stats/${data.event._id}`, { headers: { Authorization: `Bearer ${token}` } });
                    setStats(statsData.data);
                } catch (e) { }
            }
        } catch (err) {
            setStatus('error');
            setTimeout(clearStatus, 5000);
            setMessage(err.response?.data?.message || err.message);
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
                    {stats.totalRegistrations > 0 && (
                        <div className="mb-6 bg-indigo-50 p-4 rounded-lg flex justify-between items-center shadow-sm">
                            <div>
                                <p className="text-sm text-indigo-800 font-semibold mb-1">Live Dashboard</p>
                                <p className="text-2xl font-bold text-indigo-900">
                                    {stats.attendedCount} <span className="text-base font-normal text-indigo-600">/ {stats.totalRegistrations}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-indigo-600 uppercase font-bold tracking-wide">Scanned</p>
                                <p className="text-sm text-indigo-800 font-medium">{stats.totalRegistrations - stats.attendedCount} remaining</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={overrideMode ? handleOverride : handleScan} className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {overrideMode ? 'Manual Override Ticket' : 'Scan Ticket (Enter ID)'}
                        </label>
                        <div className="flex mb-2">
                            <input
                                type="text"
                                value={ticketId}
                                onChange={(e) => setTicketId(e.target.value)}
                                placeholder="FEL-XXXXXXXX"
                                className="flex-1 block w-full border border-gray-300 rounded-l-md shadow-sm p-3 font-mono text-lg uppercase"
                                autoFocus
                            />
                            <button type="submit" className={`text-white px-4 py-2 rounded-r-md ${overrideMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                {overrideMode ? 'Override' : 'Verify'}
                            </button>
                        </div>
                        {overrideMode && (
                            <input
                                type="text"
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder="Reason for override..."
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 mb-2"
                                required
                            />
                        )}
                        <button type="button" onClick={() => setOverrideMode(!overrideMode)} className="text-sm text-gray-500 hover:text-gray-700 underline">
                            {overrideMode ? 'Switch to Normal Scan' : 'Needs Manual Override?'}
                        </button>
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
