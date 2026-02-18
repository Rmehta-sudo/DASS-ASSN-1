import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormRenderer from '../components/FormRenderer';
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

    // Merchandise State
    const [selectedMerchItems, setSelectedMerchItems] = useState([]); // Array of { itemId, quantity, price }
    const [totalMerchCost, setTotalMerchCost] = useState(0);

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    useEffect(() => {
        // Calculate total cost whenever selection changes
        const total = selectedMerchItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotalMerchCost(total);
    }, [selectedMerchItems]);

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

    const handleMerchSelect = (item) => {
        setSelectedMerchItems(prev => {
            const exists = prev.find(p => p.itemId === item._id);
            if (exists) {
                // If already selected, remove it (toggle off)
                return prev.filter(p => p.itemId !== item._id);
            } else {
                // Add new item with qty 1
                return [...prev, { itemId: item._id, quantity: 1, price: item.price }];
            }
        });
    };

    const updateMerchQuantity = (itemId, change) => {
        setSelectedMerchItems(prev => prev.map(p => {
            if (p.itemId === itemId) {
                const newQty = p.quantity + change;
                if (newQty < 1) return p; // Don't go below 1, user should deselect to remove
                return { ...p, quantity: newQty };
            }
            return p;
        }));
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
                responses: formResponses,
                merchandiseSelection: selectedMerchItems
            };

            await axios.post(`${API_URL}/registrations`, payload, config);
            alert("Registered successfully!");

            // Refresh details
            fetchEventDetails();
            setSelectedMerchItems([]);
            setFormResponses({});
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
                            <span className="font-bold">Date:</span> {new Date(event.startDate).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Location:</span> {event.location || 'Campus'}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Fee:</span> {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
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
                            <FormRenderer
                                formFields={event.formFields}
                                responses={formResponses}
                                onResponseChange={(label, value) => setFormResponses(prev => ({ ...prev, [label]: value }))}
                            />

                            {/* Merchandise Selection */}
                            {event.merchandise && event.merchandise.length > 0 && (
                                <div className="mt-8 border-t pt-6">
                                    <h4 className="text-lg font-bold mb-4">Buy Merchandise</h4>
                                    <p className="text-sm text-gray-500 mb-4">Select items to purchase (click to select/deselect)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {event.merchandise.map((item, idx) => {
                                            const isSelected = selectedMerchItems.some(s => s.itemId === item._id);
                                            const currentSelection = selectedMerchItems.find(s => s.itemId === item._id);
                                            const quantity = currentSelection ? currentSelection.quantity : 0;

                                            return (
                                                <div key={idx}
                                                    className={`p-4 rounded-xl border-2 transition-all relative ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-gray-300 bg-white'
                                                        }`}
                                                >
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => handleMerchSelect(item)}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div className="font-semibold text-gray-800">{item.name}</div>
                                                            {isSelected && <div className="text-indigo-600 font-bold">✓</div>}
                                                        </div>
                                                        <div className="text-indigo-600 font-bold mt-1">₹{item.price}</div>
                                                        <div className="text-xs text-gray-500 mt-1">{item.stock} left</div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-3 flex items-center gap-2 border-t pt-2 border-indigo-200">
                                                            <span className="text-xs font-semibold text-indigo-800">Qty:</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateMerchQuantity(item._id, -1); }}
                                                                className="w-6 h-6 flex items-center justify-center bg-white rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-100"
                                                            >-</button>
                                                            <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateMerchQuantity(item._id, 1); }}
                                                                className="w-6 h-6 flex items-center justify-center bg-white rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-100"
                                                                disabled={quantity >= item.stock || (item.limitPerUser && quantity >= item.limitPerUser)}
                                                            >+</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {totalMerchCost > 0 && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200">
                                            <span className="font-semibold text-gray-700">Merchandise Total:</span>
                                            <span className="font-bold text-xl text-indigo-600">₹{totalMerchCost}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleRegister}
                                className="w-full mt-8 btn-primary text-lg py-3 rounded-xl shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-transform transform active:scale-95"
                            >
                                {event.type === 'Merchandise' ?
                                    `Purchase Items (Total: ₹${totalMerchCost})` :
                                    `Confirm Registration ${totalMerchCost > 0 ? `(+ ₹${totalMerchCost} Merch)` : ''} ${event.registrationFee > 0 ? `(Fee: ₹${event.registrationFee})` : ''}`
                                }
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                            <div className="text-5xl mb-4 text-green-600">✓</div>
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
