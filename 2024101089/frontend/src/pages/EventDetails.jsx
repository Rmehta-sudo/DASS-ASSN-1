import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormRenderer from '../components/FormRenderer';

import DiscussionForum from '../components/DiscussionForum';
import FeedbackForm from '../components/FeedbackForm';
import { API_URL } from '../apiConfig';

const RegistrationDetails = ({ reg }) => (
    <div className="mt-4 text-left bg-white p-4 rounded-lg shadow-inner">
        <h4 className="font-bold text-gray-700 mb-2">Registration Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="font-semibold">Status:</span> {reg.status}</div>
            <div><span className="font-semibold">Role:</span> {reg.role}</div>

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
                return prev;
            } else {
                // Initialize default variants if possible
                const initialVariants = {};
                if (item.variants) {
                    item.variants.forEach(v => {
                        if (v.options && v.options.length > 0) {
                            initialVariants[v.type] = v.options[0];
                        }
                    });
                }
                return [...prev, { itemId: item._id, quantity: 1, price: item.price, variant: initialVariants }];
            }
        });
    };

    const updateMerchQuantity = (itemId, change, limit = null, stock = Infinity) => {
        setSelectedMerchItems(prev => {
            const updated = prev.map(p => {
                if (p.itemId === itemId) {
                    const newQty = p.quantity + change;
                    if (newQty < 1) return null; // Remove if 0
                    if (newQty > stock) return p;
                    if (limit && newQty > limit) return p;
                    return { ...p, quantity: newQty };
                }
                return p;
            });
            return updated.filter(Boolean); // Filter out nulls
        });
    };

    const updateMerchVariant = (itemId, type, value) => {
        setSelectedMerchItems(prev => prev.map(p => {
            if (p.itemId === itemId) {
                return { ...p, variant: { ...p.variant, [type]: value } };
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
                                        {event.merchandise.map((item) => {
                                            const currentSelection = selectedMerchItems.find(s => s.itemId === item._id);
                                            const isSelected = !!currentSelection;
                                            const quantity = currentSelection ? currentSelection.quantity : 0;

                                            return (
                                                <div key={item._id}
                                                    className={`p-4 rounded-xl border-2 transition-all relative flex flex-col justify-between ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-gray-300 bg-white'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-semibold text-gray-800">{item.name}</div>
                                                            {isSelected && <div className="text-indigo-600 font-bold">Selected</div>}
                                                        </div>
                                                        <div className="text-indigo-600 font-bold">₹{item.price}</div>
                                                        <div className="text-xs text-gray-500 mt-1">{item.stock} left</div>
                                                        {item.limitPerUser && <div className="text-xs text-orange-500">Max {item.limitPerUser} / person</div>}

                                                        {item.variants && item.variants.map((variantDef, vIndex) => (
                                                            <div key={vIndex} className="mt-3">
                                                                <label className="text-xs font-semibold text-gray-600 block mb-1">{variantDef.type}:</label>
                                                                <select
                                                                    className="w-full text-sm border-gray-300 rounded p-1 bg-white"
                                                                    value={currentSelection?.variant?.[variantDef.type] || ''}
                                                                    onChange={(e) => {
                                                                        if (isSelected) {
                                                                            updateMerchVariant(item._id, variantDef.type, e.target.value);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    disabled={!isSelected}
                                                                >
                                                                    {variantDef.options.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                                                        {isSelected ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); updateMerchQuantity(item._id, -1, item.limitPerUser, item.stock); }}
                                                                    className="w-8 h-8 flex items-center justify-center bg-white rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-100 font-bold active:bg-indigo-200 transition-colors"
                                                                >-</button>
                                                                <span className="text-sm font-bold w-6 text-center select-none">{quantity}</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); updateMerchQuantity(item._id, 1, item.limitPerUser, item.stock); }}
                                                                    className="w-8 h-8 flex items-center justify-center bg-white rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-100 font-bold active:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:border-gray-200 disabled:text-gray-400"
                                                                    disabled={quantity >= item.stock || (item.limitPerUser && quantity >= item.limitPerUser)}
                                                                    title={item.limitPerUser && quantity >= item.limitPerUser ? `Limit ${item.limitPerUser} per person` : ''}
                                                                >+</button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    // Add with default variant if exists
                                                                    handleMerchSelect(item);
                                                                }}
                                                                className={`w-full py-2 rounded font-semibold text-sm transition-colors ${item.stock > 0
                                                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                                disabled={item.stock <= 0}
                                                            >
                                                                {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                                            </button>
                                                        )}
                                                    </div>
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
                                disabled={isEnded || (event.registrationLimit > 0 && event.currentRegistrations >= event.registrationLimit)}
                                className={`w-full mt-8 btn-primary text-lg py-3 rounded-xl shadow-lg font-bold transition-all transform active:scale-95 ${isEnded || (event.registrationLimit > 0 && event.currentRegistrations >= event.registrationLimit)
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                                    : 'shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                {isEnded ? 'Event Ended' :
                                    (event.registrationLimit > 0 && event.currentRegistrations >= event.registrationLimit) ? 'Registration Full' :
                                        event.type === 'Merchandise' ?
                                            `Purchase Items (Total: ₹${totalMerchCost})` :
                                            `Confirm Registration ${totalMerchCost > 0 ? `(+ ₹${totalMerchCost} Merch)` : ''} ${event.registrationFee > 0 ? `(Fee: ₹${event.registrationFee})` : ''}`
                                }
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                            <div className="text-5xl mb-4 text-green-600 font-bold">Confirmed</div>
                            <h2 className="text-2xl font-bold text-green-800 mb-2">You are confirmed!</h2>
                            <p className="text-green-700 mb-4">Ticket ID: <span className="font-mono font-bold bg-white px-2 py-1 rounded border border-green-200">{registration.ticketId || 'Generating...'}</span></p>

                            <RegistrationDetails reg={registration} />
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
