import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormBuilder from '../components/FormBuilder';
import EventTeam from '../components/EventTeam';
import DiscussionForum from '../components/DiscussionForum';
import FeedbackForm from '../components/FeedbackForm';
import { API_URL } from '../apiConfig';

const RegistrationDetails = ({ reg }) => (
    <div className="mt-4 text-left bg-white p-4 rounded-lg shadow-inner">
        <h4 className="font-bold text-gray-700 mb-2">Registration Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-semibold">Status:</span> {reg.status}</div>
            <div><span className="font-semibold">Role:</span> {reg.role}</div>
            {reg.teamId && <div><span className="font-semibold">Team:</span> {reg.teamId}</div>}
        </div>
    </div>
);

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registration, setRegistration] = useState(null); // Existing registration
    const [formResponses, setFormResponses] = useState({}); // For custom form answers
    const [selectedMerch, setSelectedMerch] = useState(null);

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const { data: eventData } = await axios.get(`${API_URL}/events/${id}`);
            setEvent(eventData);

            // If logged in, check registration status
            const token = localStorage.getItem('token');
            if (user && token) {
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };
                try {
                    const regRes = await axios.get(`${API_URL}/registrations/check/${id}`, config);
                    if (regRes.data.isRegistered) {
                        setRegistration(regRes.data.registration);
                    }
                } catch (err) {
                    // console.error("Error checking registration", err);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching event details", error);
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Prepare payload
            const payload = {
                eventId: id,
                responses: formResponses
            };

            // Note: Merchandise logic would typically go here or be processed by backend.
            // For now, we mainly send form responses.

            await axios.post(`${API_URL}/registrations`, payload, config);
            alert("Registered successfully!");

            // Refresh details
            fetchEventDetails();
        } catch (error) {
            alert(error.response?.data?.message || "Registration failed");
        }
    };

    if (loading) return <div className="flex bg-white h-screen items-center justify-center">Loading...</div>;
    if (!event) return <div className="text-center mt-20">Event not found</div>;

    const isEnded = new Date() > new Date(event.endDate);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
            {/* Header Banner */}
            <div className="glass rounded-3xl p-8 mb-8 relative overflow-hidden border border-white/50">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <span className="px-4 py-1.5 rounded-full bg-white/50 backdrop-blur text-indigo-700 font-semibold text-sm">
                            {event.type} Event
                        </span>
                        {isEnded && (
                            <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
                                Event Ended
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">{event.name}</h1>
                    <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">{event.description}</p>

                    <div className="mt-6 flex flex-wrap gap-6 text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                            <span>📅</span> {new Date(event.startDate).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                            <span>📍</span> {event.location || 'Campus'}
                        </div>
                        <div className="flex items-center gap-2">
                            <span>💰</span> {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form / Registration Status */}
                <div className="lg:col-span-2 space-y-8 h-fit">
                    {!registration ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <h3 className="text-2xl font-bold mb-6 text-gray-800">Register Now</h3>
                            <FormBuilder
                                formFields={event.formFields}
                                setResponses={setFormResponses}
                            />

                            {/* Merchandise Selection */}
                            {event.merchandise && event.merchandise.length > 0 && (
                                <div className="mt-8 border-t pt-6">
                                    <h4 className="text-lg font-bold mb-4">Buy Merchandise</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {event.merchandise.map((item, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMerch?.name === item.name ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-300'
                                                }`} onClick={() => setSelectedMerch(item)}>
                                                <div className="font-semibold text-gray-800">{item.name}</div>
                                                <div className="text-indigo-600 font-bold">₹{item.price}</div>
                                                <div className="text-xs text-gray-500 mt-1">{item.stock} left</div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedMerch && (
                                        <button
                                            className="mt-2 text-sm text-red-500 underline"
                                            onClick={() => setSelectedMerch(null)}
                                        >
                                            Remove Selection
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleRegister}
                                className="w-full mt-8 btn-primary text-lg py-3 rounded-xl shadow-lg shadow-indigo-200"
                            >
                                Confirm Registration {selectedMerch ? `(Total: ₹${event.registrationFee + selectedMerch.price})` : (event.registrationFee > 0 ? `(Pay ₹${event.registrationFee})` : '')}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                            <div className="text-5xl mb-4">🎉</div>
                            <h2 className="text-2xl font-bold text-green-800 mb-2">You are confirmed!</h2>
                            <p className="text-green-700 mb-4">Ticket ID: <span className="font-mono font-bold bg-white px-2 py-1 rounded border border-green-200">{registration.ticketId || 'Generating...'}</span></p>

                            <RegistrationDetails reg={registration} />
                        </div>
                    )}

                    {/* Team Section (Tier A) */}
                    {registration && event.type === 'Team' && (
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                            <h3 className="text-xl font-bold mb-4">Team Management</h3>
                            <EventTeam event={event} user={user} registration={registration} onRefetch={fetchEventDetails} />
                        </div>
                    )}
                </div>

                {/* Right Column: Chat & Feedback */}
                <div className="space-y-8">
                    {/* Discussion Forum (Tier B) */}
                    {registration && (
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 h-[600px] flex flex-col">
                            <h3 className="text-xl font-bold mb-4">Live Discussion</h3>
                            <div className="flex-1 overflow-hidden">
                                <DiscussionForum eventId={event._id} user={user} />
                            </div>
                        </div>
                    )}

                    {/* Feedback System (Tier C) */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <FeedbackForm
                            eventId={event._id}
                            registrationStatus={registration?.status}
                            eventEndDate={event.endDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
