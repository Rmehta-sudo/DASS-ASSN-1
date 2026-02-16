import { useState, useEffect } from 'react';
import axios from 'axios';
import TeamChat from './TeamChat';
import { API_URL } from '../apiConfig';

const EventTeam = ({ event, user, registration, onRefetch }) => {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState('');
    const [teamName, setTeamName] = useState('');
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (registration?.team) {
            fetchTeam();
        } else {
            setLoading(false);
        }
    }, [registration]);

    const fetchTeam = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API_URL}/teams/${event._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeam(data);
            setLoading(false);
        } catch (err) {
            // If 404, maybe left team?
            setTeam(null);
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/teams`, {
                eventId: event._id,
                name: teamName
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Team Created!');
            onRefetch(); // Refetch event/reg details
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/teams/join`, {
                inviteCode
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Joined Team!');
            onRefetch();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm("Are you sure you want to leave the team?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/teams/leave`, {
                teamId: team._id
            }, { headers: { Authorization: `Bearer ${token}` } });
            setTeam(null);
            onRefetch();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    if (loading) return <div>Loading Team Info...</div>;

    // SCENARIO 1: User is in a team
    if (team) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6 border-t-4 border-indigo-500">
                <h3 className="text-xl font-bold mb-4">Your Team: {team.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-gray-600 mb-2 font-mono bg-gray-100 p-2 rounded inline-block">
                            Invite Code: <span className="font-bold text-indigo-600">{team.inviteCode}</span>
                        </p>
                        <p className="text-sm text-gray-500 mb-4">Share this code with teammates to join.</p>
                        {team.leader?._id === user._id && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Team Leader</span>}
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Members ({team.members.length}/{event.teamSizeMax})</h4>
                        <ul className="space-y-1">
                            {team.members.map(m => (
                                <li key={m?._id} className="text-sm text-gray-700 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    {m.firstName} {m.lastName}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                    <button onClick={handleLeaveTeam} className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Leave Team
                    </button>
                    {team.leader?._id === user._id && team.members.length === 1 && (
                        <span className="text-gray-400 text-xs ml-4">(Team will be deleted if you leave)</span>
                    )}
                </div>

                {/* Team Chat (Tier B) */}
                <TeamChat teamId={team._id} user={user} />
            </div>
        );
    }

    // SCENARIO 2: User NOT in a team (but registered/ready to join)
    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner mt-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Team Management</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {msg && <div className="text-green-600 mb-2">{msg}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                {/* Create Team */}
                <div className="pr-4">
                    <h4 className="font-semibold mb-2">Create a New Team</h4>
                    <form onSubmit={handleCreateTeam}>
                        <input
                            type="text"
                            placeholder="Team Name"
                            className="w-full border p-2 rounded mb-2"
                            value={teamName} onChange={e => setTeamName(e.target.value)}
                            required
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full">
                            Create Team
                        </button>
                    </form>
                </div>

                {/* Join Team */}
                <div className="pl-4 pt-4 md:pt-0">
                    <h4 className="font-semibold mb-2">Join Existing Team</h4>
                    <form onSubmit={handleJoinTeam}>
                        <input
                            type="text"
                            placeholder="Enter Invite Code"
                            className="w-full border p-2 rounded mb-2 font-mono uppercase"
                            value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                            required
                        />
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full">
                            Join Team
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventTeam;
